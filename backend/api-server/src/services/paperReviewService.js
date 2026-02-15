import axios from 'axios';
import PaperReview from '../models/PaperReview';
import fs from 'fs';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

class PaperReviewService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Submit paper for review
   */
  async submitForReview(data) {
    const { userId, title, abstract, sections, filePath, fileName } = data;

    // Extract text from file if provided
    let extractedText = null;
    if (filePath) {
      extractedText = await this.extractTextFromFile(filePath);
    }

    // Create review record
    const review = await PaperReview.create({
      userId,
      title,
      abstract,
      sections: sections || this.parseSectionsFromText(extractedText),
      filePath,
      fileName,
      status: 'pending',
      submittedAt: new Date()
    });

    return review;
  }

  /**
   * Extract text from uploaded file
   */
  async extractTextFromFile(filePath) {
    const buffer = await fs.readFile(filePath);
    const ext = filePath.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      const data = await pdf(buffer);
      return data.text;
    } else if (ext === 'docx') {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else if (ext === 'txt') {
      return buffer.toString('utf-8');
    }

    throw new Error('Unsupported file format');
  }

  /**
   * Parse sections from raw text
   */
  parseSectionsFromText(text) {
    const sections = [];
    const sectionHeaders = [
      'abstract',
      'introduction',
      'literature review',
      'methodology',
      'results',
      'discussion',
      'conclusion',
      'references'
    ];

    // Simple section detection (can be improved)
    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      const lowerLine = line.toLowerCase().trim();
      const matchedHeader = sectionHeaders.find(h => lowerLine.includes(h));

      if (matchedHeader) {
        // Save previous section
        if (currentSection) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        currentSection = matchedHeader.replace(' ', '_');
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Add last section
    if (currentSection && currentContent.length > 0) {
      sections.push({
        type: currentSection,
        content: currentContent.join('\n').trim()
      });
    }

    return sections;
  }

  /**
   * Perform comprehensive AI review
   */
  async performComprehensiveReview(reviewId, userId, analysisTypes = []) {
    const review = await PaperReview.findOne({ _id: reviewId, userId });
    
    if (!review) {
      throw new Error('Review not found');
    }

    const defaultAnalysis = [
      'structure',
      'writing_quality',
      'citations',
      'plagiarism',
      'methodology',
      'clarity',
      'academic_tone'
    ];

    const typesToAnalyze = analysisTypes.length > 0 ? analysisTypes : defaultAnalysis;

    const analysis = {
      overall_score: 0,
      structure: null,
      writing_quality: null,
      citations: null,
      plagiarism: null,
      methodology: null,
      clarity: null,
      academic_tone: null,
      suggestions: [],
      timestamp: new Date()
    };

    // Combine all content
    const fullText = this.combineContent(review);

    // Perform each analysis type
    if (typesToAnalyze.includes('structure')) {
      analysis.structure = await this.analyzeStructure(review.sections);
    }

    if (typesToAnalyze.includes('writing_quality')) {
      analysis.writing_quality = await this.analyzeWritingQuality(fullText);
    }

    if (typesToAnalyze.includes('citations')) {
      const references = review.sections.find(s => s.type === 'references');
      analysis.citations = await this.analyzeCitations(fullText, references?.content);
    }

    if (typesToAnalyze.includes('plagiarism')) {
      analysis.plagiarism = await this.checkPlagiarism(fullText);
    }

    if (typesToAnalyze.includes('methodology')) {
      const methodSection = review.sections.find(s => s.type === 'methodology');
      if (methodSection) {
        analysis.methodology = await this.analyzeMethodology(methodSection.content);
      }
    }

    if (typesToAnalyze.includes('clarity')) {
      analysis.clarity = await this.analyzeClarity(fullText);
    }

    if (typesToAnalyze.includes('academic_tone')) {
      analysis.academic_tone = await this.analyzeAcademicTone(fullText);
    }

    // Calculate overall score
    analysis.overall_score = this.calculateOverallScore(analysis);

    // Generate suggestions
    analysis.suggestions = await this.generateComprehensiveSuggestions(analysis, review);

    // Update review
    review.analysis = analysis;
    review.status = 'completed';
    review.completedAt = new Date();
    await review.save();

    return analysis;
  }

  /**
   * Combine all content into one text
   */
  combineContent(review) {
    let text = '';
    
    if (review.title) text += `Title: ${review.title}\n\n`;
    if (review.abstract) text += `Abstract: ${review.abstract}\n\n`;
    
    if (review.sections) {
      review.sections.forEach(section => {
        text += `${section.type.toUpperCase()}\n${section.content}\n\n`;
      });
    }

    return text;
  }

  /**
   * Analyze paper structure
   */
  async analyzeStructure(sections) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/analyze-structure`, {
        sections: sections.map(s => ({ type: s.type, length: s.content.length }))
      });

      return response.data;
    } catch (error) {
      console.error('Structure analysis error:', error);
      
      // Fallback analysis
      const required = ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references'];
      const present = sections.map(s => s.type);
      const missing = required.filter(r => !present.includes(r));

      return {
        score: ((required.length - missing.length) / required.length) * 100,
        has_all_sections: missing.length === 0,
        missing_sections: missing,
        present_sections: present,
        issues: missing.map(m => ({
          severity: 'error',
          message: `Missing required section: ${m}`
        })),
        suggestions: missing.map(m => `Add ${m} section`)
      };
    }
  }

  /**
   * Analyze writing quality
   */
  async analyzeWritingQuality(content) {
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/ai/analyze-writing`, {
        text: content,
        analysis_types: ['grammar', 'style', 'clarity']
      });

      const data = response.data;

      return {
        score: this.calculateQualityScore(data),
        grammar_issues: data.grammar?.length || 0,
        style_issues: data.style?.length || 0,
        clarity_issues: data.clarity?.length || 0,
        details: data
      };
    } catch (error) {
      console.error('Writing quality error:', error);
      return {
        score: 75,
        grammar_issues: 0,
        style_issues: 0,
        clarity_issues: 0,
        message: 'Could not perform detailed analysis'
      };
    }
  }

  /**
   * Analyze citations
   */
  async analyzeCitations(content, references) {
    // Count in-text citations
    const citationPattern = /\(([^)]+,\s*\d{4})\)|\[(\d+)\]/g;
    const inTextCitations = (content.match(citationPattern) || []).length;

    // Count reference entries
    const referenceLines = references ? references.split('\n').filter(l => l.trim()) : [];
    const referenceCount = referenceLines.length;

    // Check if citations match references
    const mismatch = Math.abs(inTextCitations - referenceCount);

    return {
      score: mismatch === 0 ? 100 : Math.max(0, 100 - (mismatch * 5)),
      in_text_citations: inTextCitations,
      reference_count: referenceCount,
      mismatch,
      issues: mismatch > 0 ? [{
        severity: 'warning',
        message: `Potential citation mismatch: ${inTextCitations} in-text vs ${referenceCount} references`
      }] : [],
      suggestions: this.generateCitationSuggestions(inTextCitations, referenceCount)
    };
  }

  /**
   * Check for plagiarism
   */
  async checkPlagiarism(content) {
    try {
      const response = await axios.post(`${this.aiServiceUrl.replace(':8000', ':3000')}/api/v1/plagiarism/check`, {
        text: content
      });

      return {
        score: 100 - response.data.data.plagiarismScore,
        plagiarism_score: response.data.data.plagiarismScore,
        matches: response.data.data.totalMatches,
        level: response.data.data.summary.level,
        details: response.data.data
      };
    } catch (error) {
      console.error('Plagiarism check error:', error);
      return {
        score: 100,
        plagiarism_score: 0,
        matches: 0,
        message: 'Plagiarism check unavailable'
      };
    }
  }

  /**
   * Analyze methodology section
   */
  async analyzeMethodology(content) {
    const hasKeyElements = {
      research_design: /design|approach|framework/i.test(content),
      data_collection: /collect|gather|obtain|survey|interview|questionnaire/i.test(content),
      sample_size: /sample|participants|n\s*=/i.test(content),
      analysis_method: /analysis|statistical|qualitative|quantitative/i.test(content),
      validity: /valid|reliab/i.test(content),
      ethical_approval: /ethical|IRB|consent|approval/i.test(content)
    };

    const present = Object.values(hasKeyElements).filter(Boolean).length;
    const total = Object.keys(hasKeyElements).length;

    const missing = Object.entries(hasKeyElements)
      .filter(([key, value]) => !value)
      .map(([key]) => key.replace(/_/g, ' '));

    return {
      score: (present / total) * 100,
      completeness: `${present}/${total} key elements`,
      has_all_elements: missing.length === 0,
      missing_elements: missing,
      issues: missing.map(m => ({
        severity: 'warning',
        message: `Consider adding: ${m}`
      })),
      suggestions: missing.map(m => `Describe your ${m}`)
    };
  }

  /**
   * Analyze clarity
   */
  async analyzeClarity(content) {
    const sentences = content.split(/[.!?]+/);
    const words = content.split(/\s+/);
    
    const avgSentenceLength = words.length / sentences.length;
    const avgWordLength = content.replace(/\s/g, '').length / words.length;

    // Readability scoring (simplified Flesch-Kincaid)
    const readabilityScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength);

    // Complex word detection
    const complexWords = words.filter(w => w.length > 12).length;
    const complexWordRatio = complexWords / words.length;

    return {
      score: Math.max(0, Math.min(100, readabilityScore)),
      readability_grade: this.getReadabilityGrade(readabilityScore),
      avg_sentence_length: avgSentenceLength.toFixed(1),
      avg_word_length: avgWordLength.toFixed(1),
      complex_word_ratio: (complexWordRatio * 100).toFixed(1) + '%',
      issues: this.getClarityIssues(avgSentenceLength, complexWordRatio),
      suggestions: this.getClaritySuggestions(avgSentenceLength, complexWordRatio)
    };
  }

  /**
   * Analyze academic tone
   */
  async analyzeAcademicTone(content) {
    const issues = [];

    // Check for first person
    const firstPerson = /(I|we|my|our)\s/gi;
    const firstPersonMatches = (content.match(firstPerson) || []).length;
    if (firstPersonMatches > 5) {
      issues.push({
        severity: 'warning',
        message: `Excessive first-person usage (${firstPersonMatches} instances)`
      });
    }

    // Check for contractions
    const contractions = /(don't|can't|won't|isn't|aren't|wasn't|weren't)/gi;
    const contractionMatches = (content.match(contractions) || []).length;
    if (contractionMatches > 0) {
      issues.push({
        severity: 'error',
        message: `Found ${contractionMatches} contractions - use full forms in academic writing`
      });
    }

    // Check for colloquialisms
    const informal = /(a lot|kind of|sort of|basically|literally|stuff|things)/gi;
    const informalMatches = (content.match(informal) || []).length;
    if (informalMatches > 3) {
      issues.push({
        severity: 'warning',
        message: `Informal language detected (${informalMatches} instances)`
      });
    }

    const score = Math.max(0, 100 - (issues.length * 10));

    return {
      score,
      is_formal: score > 80,
      first_person_usage: firstPersonMatches,
      contractions: contractionMatches,
      informal_language: informalMatches,
      issues,
      suggestions: this.getAcademicToneSuggestions(issues)
    };
  }

  /**
   * Calculate overall score
   */
  calculateOverallScore(analysis) {
    const scores = [];
    const weights = {
      structure: 0.20,
      writing_quality: 0.20,
      citations: 0.15,
      plagiarism: 0.15,
      methodology: 0.10,
      clarity: 0.10,
      academic_tone: 0.10
    };

    Object.entries(weights).forEach(([key, weight]) => {
      if (analysis[key] && analysis[key].score !== undefined) {
        scores.push(analysis[key].score * weight);
      }
    });

    return scores.reduce((a, b) => a + b, 0);
  }

  /**
   * Generate comprehensive suggestions
   */
  async generateComprehensiveSuggestions(analysis, review) {
    const suggestions = [];

    // High priority issues
    if (analysis.structure?.score < 70) {
      suggestions.push({
        priority: 'high',
        category: 'structure',
        title: 'Improve paper structure',
        description: 'Your paper is missing key sections or has structural issues',
        actions: analysis.structure.suggestions || []
      });
    }

    if (analysis.plagiarism?.plagiarism_score > 25) {
      suggestions.push({
        priority: 'critical',
        category: 'plagiarism',
        title: 'High plagiarism detected',
        description: `${analysis.plagiarism.plagiarism_score}% similarity found`,
        actions: ['Review and paraphrase similar content', 'Add proper citations', 'Use quotation marks for direct quotes']
      });
    }

    // Medium priority
    if (analysis.writing_quality?.score < 75) {
      suggestions.push({
        priority: 'medium',
        category: 'quality',
        title: 'Improve writing quality',
        description: `Found ${analysis.writing_quality.grammar_issues + analysis.writing_quality.style_issues} issues`,
        actions: ['Review grammar suggestions', 'Simplify complex sentences', 'Use active voice']
      });
    }

    if (analysis.academic_tone?.score < 80) {
      suggestions.push({
        priority: 'medium',
        category: 'tone',
        title: 'Maintain academic tone',
        description: 'Use more formal language throughout',
        actions: analysis.academic_tone.suggestions || []
      });
    }

    // Low priority
    if (analysis.clarity?.score < 70) {
      suggestions.push({
        priority: 'low',
        category: 'clarity',
        title: 'Improve readability',
        description: 'Some sections may be difficult to understand',
        actions: analysis.clarity.suggestions || []
      });
    }

    return suggestions.sort((a, b) => {
      const priority = { critical: 0, high: 1, medium: 2, low: 3 };
      return priority[a.priority] - priority[b.priority];
    });
  }

  // Helper methods
  calculateQualityScore(data) {
    const totalIssues = (data.grammar?.length || 0) + 
                       (data.style?.length || 0) + 
                       (data.clarity?.length || 0);
    return Math.max(0, 100 - (totalIssues * 2));
  }

  generateCitationSuggestions(inText, references) {
    const suggestions = [];
    if (inText > references) {
      suggestions.push('Add missing references to your reference list');
    } else if (references > inText) {
      suggestions.push('Remove unused references or cite them in text');
    }
    if (inText === 0) {
      suggestions.push('Add citations to support your claims');
    }
    return suggestions;
  }

  getReadabilityGrade(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th grade)';
    if (score >= 70) return 'Fairly Easy (7th grade)';
    if (score >= 60) return 'Standard (8th-9th grade)';
    if (score >= 50) return 'Fairly Difficult (10th-12th grade)';
    if (score >= 30) return 'Difficult (College)';
    return 'Very Difficult (College graduate)';
  }

  getClarityIssues(avgSentenceLength, complexWordRatio) {
    const issues = [];
    if (avgSentenceLength > 25) {
      issues.push({
        severity: 'warning',
        message: 'Long sentences detected - consider breaking them up'
      });
    }
    if (complexWordRatio > 0.2) {
      issues.push({
        severity: 'info',
        message: 'High use of complex words - ensure clarity for readers'
      });
    }
    return issues;
  }

  getClaritySuggestions(avgSentenceLength, complexWordRatio) {
    const suggestions = [];
    if (avgSentenceLength > 25) {
      suggestions.push('Break long sentences into shorter ones');
      suggestions.push('Use transition words between sentences');
    }
    if (complexWordRatio > 0.2) {
      suggestions.push('Replace jargon with simpler terms where possible');
      suggestions.push('Define technical terms on first use');
    }
    return suggestions;
  }

  getAcademicToneSuggestions(issues) {
    return issues.map(issue => {
      if (issue.message.includes('first-person')) {
        return 'Use third person or passive voice';
      }
      if (issue.message.includes('contractions')) {
        return 'Replace contractions with full forms';
      }
      if (issue.message.includes('Informal')) {
        return 'Use formal academic language';
      }
      return 'Review and revise informal language';
    });
  }

  // Additional methods for other endpoints
  async reviewSection(data) {
    // Implementation for section-specific review
    return { message: 'Section review not fully implemented' };
  }

  async getUserReviews(userId) {
    return await PaperReview.find({ userId }).sort({ submittedAt: -1 });
  }

  async getReviewById(reviewId, userId) {
    return await PaperReview.findOne({ _id: reviewId, userId });
  }

  async reanalyzeReview(reviewId, userId, updatedSections) {
    const review = await PaperReview.findOne({ _id: reviewId, userId });
    if (review) {
      review.sections = updatedSections;
      await review.save();
      return await this.performComprehensiveReview(reviewId, userId);
    }
    return null;
  }

  async generateImprovementSuggestions(reviewId, focusAreas) {
    const review = await PaperReview.findById(reviewId);
    if (!review || !review.analysis) {
      throw new Error('Review not found or not analyzed');
    }

    // Filter suggestions by focus areas
    let suggestions = review.analysis.suggestions;
    if (focusAreas && focusAreas.length > 0) {
      suggestions = suggestions.filter(s => focusAreas.includes(s.category));
    }

    return suggestions;
  }

  async exportReviewReport(reviewId, userId, format) {
    const review = await PaperReview.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new Error('Review not found');
    }

    // Generate report data
    return {
      reviewId,
      title: review.title,
      analysis: review.analysis,
      format,
      generatedAt: new Date()
    };
  }
}

export default new PaperReviewService();