import axios from 'axios';
import natural from 'natural';
import stringSimilarity from 'string-similarity';
import Paper from '../models/Paper.js';

class PlagiarismService {
    constructor() {
        this.tokenizer = new natural.WordTokenizer();
        this.tfidf = new natural.TfIdf();
    }

    /**
     * Check text for plagiarism using multiple methods
     */
    async checkPlagiarism(text, options = {}) {
        const { userId, excludeReferences = [] } = options;

        // Break text into sentences
        const sentences = this.splitIntoSentences(text);

        // Check against multiple sources
        const [webResults, libraryResults] = await Promise.all([
            this.checkAgainstWeb(text),
            this.checkAgainstDatabase(text, userId, excludeReferences)
        ]);

        // Analyze results
        const matches = [...webResults, ...libraryResults];
        const plagiarismScore = this.calculatePlagiarismScore(matches);
        const highlightedText = this.highlightMatches(text, matches);

        return {
            plagiarismScore,
            totalMatches: matches.length,
            matches: matches.slice(0, 10), // Top 10 matches
            highlightedText,
            summary: this.generateSummary(plagiarismScore, matches),
            timestamp: new Date()
        };
    }

    /**
     * Split text into sentences
     */
    splitIntoSentences(text) {
        return text.match(/[^.!?]+[.!?]+/g) || [];
    }

    /**
     * Check against web sources (simulated - integrate with real API)
     */
    async checkAgainstWeb(text) {
        // In production, integrate with:
        // - Turnitin API
        // - Copyscape API
        // - Google Custom Search API
        // - CrossRef Similarity Check

        // Simulated web check
        const matches = [];

        try {
            // Example: Check against arXiv papers (simplified)
            const keywords = this.extractKeywords(text);

            // Simulate finding matches
            // In production, call actual plagiarism detection APIs

            return matches;
        } catch (error) {
            console.error('Web check error:', error);
            return [];
        }
    }

    /**
     * Check against database (papers library)
     */
    async checkAgainstDatabase(text, userId, excludeReferences) {
        try {
            // Get all papers except excluded ones
            const papers = await Paper.find({
                _id: { $nin: excludeReferences }
            }).select('title abstract fullText');

            const matches = [];

            for (const paper of papers) {
                const paperText = `${paper.title} ${paper.abstract} ${paper.fullText || ''}`;
                const similarity = this.calculateSimilarity(text, paperText);

                if (similarity > 0.15) { // 15% threshold
                    const matchedSegments = this.findMatchingSegments(text, paperText);

                    matches.push({
                        source: 'database',
                        title: paper.title,
                        paperId: paper._id,
                        similarity: similarity * 100,
                        matchedSegments: matchedSegments.slice(0, 3),
                        url: `/papers/${paper._id}`
                    });
                }
            }

            return matches.sort((a, b) => b.similarity - a.similarity);
        } catch (error) {
            console.error('Database check error:', error);
            return [];
        }
    }

    /**
     * Calculate similarity between two texts
     */
    calculateSimilarity(text1, text2) {
        // Normalize texts
        const normalized1 = this.normalizeText(text1);
        const normalized2 = this.normalizeText(text2);

        // Use string similarity
        return stringSimilarity.compareTwoStrings(normalized1, normalized2);
    }

    /**
     * Find matching segments between texts
     */
    findMatchingSegments(text1, text2) {
        const sentences1 = this.splitIntoSentences(text1);
        const sentences2 = this.splitIntoSentences(text2);

        const matches = [];

        for (let i = 0; i < sentences1.length; i++) {
            for (let j = 0; j < sentences2.length; j++) {
                const similarity = this.calculateSimilarity(sentences1[i], sentences2[j]);

                if (similarity > 0.7) { // 70% similarity threshold
                    matches.push({
                        originalText: sentences1[i].trim(),
                        matchedText: sentences2[j].trim(),
                        similarity: similarity * 100,
                        startIndex: text1.indexOf(sentences1[i]),
                        endIndex: text1.indexOf(sentences1[i]) + sentences1[i].length
                    });
                }
            }
        }

        return matches;
    }

    /**
     * Normalize text for comparison
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract keywords from text
     */
    extractKeywords(text, limit = 10) {
        const tokens = this.tokenizer.tokenize(text.toLowerCase());
        const stopWords = new Set(natural.stopwords);

        // Remove stop words
        const filtered = tokens.filter(token =>
            !stopWords.has(token) && token.length > 3
        );

        // Count frequency
        const frequency = {};
        filtered.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });

        // Sort by frequency
        const sorted = Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([word]) => word);

        return sorted;
    }

    /**
     * Calculate overall plagiarism score
     */
    calculatePlagiarismScore(matches) {
        if (matches.length === 0) return 0;

        // Weight by similarity percentage
        const totalSimilarity = matches.reduce((sum, match) => sum + match.similarity, 0);
        const averageSimilarity = totalSimilarity / matches.length;

        // Adjust based on number of matches
        const matchPenalty = Math.min(matches.length * 2, 20); // Max 20% penalty

        return Math.min(averageSimilarity + matchPenalty, 100);
    }

    /**
     * Highlight matched text
     */
    highlightMatches(text, matches) {
        let highlighted = text;
        const segments = [];

        matches.forEach(match => {
            if (match.matchedSegments) {
                match.matchedSegments.forEach(segment => {
                    segments.push({
                        text: segment.originalText,
                        start: segment.startIndex,
                        end: segment.endIndex,
                        similarity: segment.similarity
                    });
                });
            }
        });

        // Sort by start index (descending) to avoid index shifting
        segments.sort((a, b) => b.start - a.start);

        return {
            originalText: text,
            segments
        };
    }

    /**
     * Generate summary
     */
    generateSummary(score, matches) {
        if (score < 10) {
            return {
                level: 'low',
                message: 'Excellent! Very low similarity detected.',
                color: 'success'
            };
        } else if (score < 25) {
            return {
                level: 'moderate',
                message: 'Some similarities found. Review the matches.',
                color: 'warning'
            };
        } else if (score < 50) {
            return {
                level: 'high',
                message: 'Significant similarities detected. Consider revising.',
                color: 'error'
            };
        } else {
            return {
                level: 'very-high',
                message: 'Very high similarity! Major revision needed.',
                color: 'error'
            };
        }
    }

    /**
     * Compare two papers
     */
    async comparePapers(paper1, paper2) {
        const text1 = `${paper1.title} ${paper1.abstract} ${paper1.fullText || ''}`;
        const text2 = `${paper2.title} ${paper2.abstract} ${paper2.fullText || ''}`;

        const similarity = this.calculateSimilarity(text1, text2);
        const matchedSegments = this.findMatchingSegments(text1, text2);

        return {
            paper1: {
                id: paper1._id,
                title: paper1.title
            },
            paper2: {
                id: paper2._id,
                title: paper2.title
            },
            similarity: similarity * 100,
            matchedSegments: matchedSegments.slice(0, 10),
            verdict: this.getVerdict(similarity * 100)
        };
    }

    /**
     * Get verdict based on similarity
     */
    getVerdict(similarity) {
        if (similarity > 70) return 'Very similar - possible duplicate';
        if (similarity > 40) return 'Highly similar - related work';
        if (similarity > 20) return 'Moderately similar - same topic';
        return 'Low similarity - different content';
    }

    /**
     * Check against user's library
     */
    async checkAgainstLibrary(text, papers) {
        const matches = [];

        for (const paper of papers) {
            const paperText = `${paper.title} ${paper.abstract}`;
            const similarity = this.calculateSimilarity(text, paperText);

            if (similarity > 0.1) {
                matches.push({
                    paperId: paper._id,
                    title: paper.title,
                    similarity: similarity * 100
                });
            }
        }

        return matches.sort((a, b) => b.similarity - a.similarity);
    }

    /**
     * Generate suggestions for improving originality
     */
    async generateSuggestions(text, matches) {
        const suggestions = [];

        // Analyze each match
        for (const match of matches.slice(0, 5)) {
            if (match.matchedSegments) {
                for (const segment of match.matchedSegments) {
                    suggestions.push({
                        original: segment.originalText,
                        suggestion: await this.paraphraseText(segment.originalText),
                        reason: `${segment.similarity.toFixed(1)}% similar to ${match.title}`,
                        type: 'paraphrase'
                    });
                }
            }
        }

        // Add citation suggestions
        const citationSuggestions = this.generateCitationSuggestions(matches);
        suggestions.push(...citationSuggestions);

        return suggestions;
    }

    /**
     * Paraphrase text (AI-powered)
     */
    async paraphraseText(text) {
        // In production, use AI service
        // For now, return simple suggestion
        return `Consider rephrasing: "${text.substring(0, 50)}..."`;
    }

    /**
     * Generate citation suggestions
     */
    generateCitationSuggestions(matches) {
        return matches.slice(0, 3).map(match => ({
            type: 'citation',
            suggestion: `Consider citing: ${match.title}`,
            reason: `High similarity (${match.similarity.toFixed(1)}%) detected`,
            action: 'add-citation',
            paperId: match.paperId
        }));
    }

    /**
     * Get detailed report
     */
    async getReport(reportId, userId) {
        // Fetch from database
        // For now, return sample
        return {
            id: reportId,
            userId,
            timestamp: new Date(),
            status: 'completed'
        };
    }
}

export default new PlagiarismService();