import axios from 'axios';
import PaperReview from '../models/PaperReview.js';
import fs from 'fs/promises';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import mammoth from 'mammoth';

class PaperReviewService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
    // Prefer API_URL or API_SERVER_URL from .env
    this.apiServerUrl = process.env.API_URL || process.env.API_SERVER_URL || 'http://localhost:3000';
  }

  /**
   * Submit paper for review
   */
  async submitForReview(data) {
    const { userId, title, abstract, sections, filePath, fileName } = data;

    // Extract text from file if provided
    let extractedText = null;
    if (filePath) {
      try {
        extractedText = await this.extractTextFromFile(filePath);
      } catch (error) {
        console.error(`Text extraction failed for ${filePath}:`, error);
        extractedText = '';
      }
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
    try {
      const buffer = await fs.readFile(filePath);
      const ext = filePath.split('.').pop().toLowerCase();

      if (ext === 'pdf') {
        const data = await pdf(buffer);
        return data.text || '';
      } else if (ext === 'docx') {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } else if (ext === 'txt') {
        return buffer.toString('utf-8');
      }

      throw new Error(`Unsupported file format: .${ext}`);
    } catch (error) {
      console.error(`Error in extractTextFromFile for ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Parse sections from raw text
   */
  parseSectionsFromText(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    const sections = [];
    const sectionHeaders = [
      { key: 'abstract', regex: /^(abstract|summary)$/i },
      { key: 'introduction', regex: /^(introduction|background)$/i },
      { key: 'literature_review', regex: /^(literature review|related work|background)$/i },
      { key: 'methodology', regex: /^(methodology|methods|experimental setup|materials and methods)$/i },
      { key: 'results', regex: /^(results|findings)$/i },
      { key: 'discussion', regex: /^(discussion|interpretation)$/i },
      { key: 'conclusion', regex: /^(conclusion|limitations|future work)$/i },
      { key: 'references', regex: /^(references|bibliography|works cited)$/i }
    ];

    const lines = text.split('\n');
    let currentSection = null;
    let currentContent = [];

    // Header regex pattern: Optional numbers/bullets + header text + optional colon/period
    // Example: "1. Introduction", "Section 2: Methodology", "ABSTRACT"
    const isHeader = (line) => {
      const cleanLine = line.trim().replace(/^(\d+\.?\s*|Section\s+\d+:?\s*|[•\-\*]\s*)/i, '').trim().toLowerCase();
      if (!cleanLine) return null;

      const match = sectionHeaders.find(h => h.regex.test(cleanLine));
      return match ? match.key : null;
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      const matchedKey = isHeader(trimmedLine);

      if (matchedKey && trimmedLine.length < 100) { // Headers are usually short
        // Save previous section if it has content
        if (currentSection && currentContent.length > 0) {
          sections.push({
            type: currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        currentSection = matchedKey;
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
    try {
      if (typesToAnalyze.includes('structure')) {
        console.log('Analyzing structure...');
        analysis.structure = await this.analyzeStructure(review.sections);
      }

      if (typesToAnalyze.includes('writing_quality')) {
        console.log('Analyzing writing quality...');
        analysis.writing_quality = await this.analyzeWritingQuality(fullText);
      }

      if (typesToAnalyze.includes('citations')) {
        console.log('Analyzing citations...');
        const references = review.sections.find(s =>
          s.type === 'references' || s.type.includes('reference')
        );
        analysis.citations = await this.analyzeCitations(fullText, references?.content);
      }

      if (typesToAnalyze.includes('plagiarism')) {
        console.log('Checking plagiarism...');
        analysis.plagiarism = await this.checkPlagiarism(fullText);
      }

      if (typesToAnalyze.includes('methodology')) {
        console.log('Analyzing methodology...');
        const methodSection = review.sections.find(s =>
          s.type === 'methodology' || s.type === 'methods'
        );
        if (methodSection) {
          analysis.methodology = await this.analyzeMethodology(methodSection.content);
        } else {
          analysis.methodology = {
            score: 0,
            completeness: "0/6 key elements",
            has_all_elements: false,
            missing_elements: ["methodology_section"],
            issues: [{
              severity: 'error',
              message: 'Methodology section is completely missing'
            }],
            suggestions: ['Add a methodology section describing your research approach']
          };
        }
      }

      if (typesToAnalyze.includes('clarity')) {
        console.log('Analyzing clarity...');
        analysis.clarity = await this.analyzeClarity(fullText);
      }

      if (typesToAnalyze.includes('academic_tone')) {
        console.log('Analyzing academic tone...');
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

      console.log('Review completed successfully');
      return analysis;

    } catch (error) {
      console.error('Analysis error:', error);
      review.status = 'failed';
      await review.save();
      throw error;
    }
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
   * Analyze paper structure - FIXED: Now calls AI service
   */
  async analyzeStructure(sections) {
    try {
      console.log(`Calling AI service at: ${this.aiServiceUrl}/api/v1/ai/analyze-structure`);

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/analyze-structure`,
        {
          sections: sections.map(s => ({
            type: s.type,
            length: s.content.length
          }))
        },
        { timeout: 30000 }
      );

      console.log('Structure analysis response received');
      return response.data;

    } catch (error) {
      console.error('Structure analysis error:', error.message);

      // Fallback analysis
      const required = ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'conclusion', 'references'];
      const present = sections.map(s => s.type);
      const missing = required.filter(r => !present.some(p => p.includes(r)));

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
      console.log('Calling writing quality analysis...');

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/analyze-writing`,
        {
          text: content.substring(0, 8000), // Limit to prevent timeout
          analysis_types: ['grammar', 'style', 'clarity']
        },
        { timeout: 60000 }
      );

      const data = response.data;

      return {
        score: this.calculateQualityScore(data),
        grammar_issues: data.grammar?.length || 0,
        style_issues: data.style?.length || 0,
        clarity_issues: data.clarity?.length || 0,
        details: data
      };

    } catch (error) {
      console.error('Writing quality error:', error.message);
      return {
        score: 75,
        grammar_issues: 0,
        style_issues: 0,
        clarity_issues: 0,
        message: 'Writing quality analysis unavailable - using fallback scoring'
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
    const referenceLines = references ? references.split('\n').filter(l => l.trim().length > 20) : [];
    const referenceCount = referenceLines.length;

    // Check if citations match references
    const mismatch = Math.abs(inTextCitations - referenceCount);

    return {
      score: mismatch === 0 ? 100 : Math.max(0, 100 - (mismatch * 5)),
      in_text_citations: inTextCitations,
      reference_count: referenceCount,
      mismatch,
      issues: mismatch > 5 ? [{
        severity: 'warning',
        message: `Significant citation mismatch: ${inTextCitations} in-text citations vs ${referenceCount} references (difference: ${mismatch})`
      }] : mismatch > 0 ? [{
        severity: 'info',
        message: `Minor citation mismatch: ${inTextCitations} in-text vs ${referenceCount} references`
      }] : [],
      suggestions: this.generateCitationSuggestions(inTextCitations, referenceCount)
    };
  }

  /**
   * Check for plagiarism - FIXED: Correct API endpoint
   */
  async checkPlagiarism(content) {
    try {
      console.log(`Calling plagiarism service at: ${this.apiServerUrl}/api/v1/plagiarism/check`);

      // FIXED: Use apiServerUrl (port 3000) not aiServiceUrl (port 8000)
      const response = await axios.post(
        `${this.apiServerUrl}/api/v1/plagiarism/check`,
        {
          text: content.substring(0, 10000) // Limit text length
        },
        {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = response.data.data;

      return {
        score: 100 - data.plagiarismScore,
        plagiarism_score: data.plagiarismScore,
        matches: data.totalMatches,
        level: data.summary.level,
        details: data
      };

    } catch (error) {
      console.error('Plagiarism check error:', error.message);
      return {
        score: 100,
        plagiarism_score: 0,
        matches: 0,
        level: 'unknown',
        message: 'Plagiarism check temporarily unavailable'
      };
    }
  }

  /**
   * Analyze methodology section - FIXED: Now calls AI service
   */
  async analyzeMethodology(content) {
    try {
      console.log('Calling methodology analysis...');

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/analyze-methodology`,
        { content: content.substring(0, 5000) },
        { timeout: 45000 }
      );

      return response.data;

    } catch (error) {
      console.error('Methodology analysis error:', error.message);

      // Fallback: Basic keyword checking
      const hasKeyElements = {
        research_design: /design|approach|framework|paradigm/i.test(content),
        data_collection: /collect|gather|obtain|survey|interview|questionnaire|observation/i.test(content),
        sample_size: /sample|participants|subjects|n\s*=|population/i.test(content),
        analysis_method: /analysis|statistical|qualitative|quantitative|spss|stata|nvivo/i.test(content),
        validity: /valid|reliab|trustworth|credib/i.test(content),
        ethical_approval: /ethical|IRB|consent|approval|ethics committee/i.test(content)
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
          message: `No clear mention of: ${m}`
        })),
        suggestions: missing.map(m => `Add detailed description of your ${m}`)
      };
    }
  }

  /**
   * Analyze clarity - FIXED: Now calls AI service
   */
  async analyzeClarity(content) {
    try {
      console.log('Calling clarity analysis...');

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/analyze-clarity`,
        { content: content.substring(0, 5000) },
        { timeout: 45000 }
      );

      return response.data;

    } catch (error) {
      console.error('Clarity analysis error:', error.message);

      // Fallback: Basic readability metrics
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      const words = content.split(/\s+/);

      const avgSentenceLength = words.length / sentences.length;
      const avgWordLength = content.replace(/\s/g, '').length / words.length;

      // Simplified Flesch-Kincaid
      const readabilityScore = Math.max(0, Math.min(100,
        206.835 - (1.015 * avgSentenceLength) - (84.6 * avgWordLength)
      ));

      const complexWords = words.filter(w => w.length > 12).length;
      const complexWordRatio = (complexWords / words.length) * 100;

      return {
        score: readabilityScore,
        readability_grade: this.getReadabilityGrade(readabilityScore),
        avg_sentence_length: `${avgSentenceLength.toFixed(1)} words`,
        complex_word_ratio: `${complexWordRatio.toFixed(1)}%`,
        issues: this.getClarityIssues(avgSentenceLength, complexWordRatio / 100),
        suggestions: this.getClaritySuggestions(avgSentenceLength, complexWordRatio / 100)
      };
    }
  }

  /**
   * Analyze academic tone - FIXED: Now calls AI service
   */
  async analyzeAcademicTone(content) {
    try {
      console.log('Calling academic tone analysis...');

      const response = await axios.post(
        `${this.aiServiceUrl}/api/v1/ai/analyze-academic-tone`,
        { content: content.substring(0, 5000) },
        { timeout: 45000 }
      );

      return response.data;

    } catch (error) {
      console.error('Academic tone analysis error:', error.message);

      // Fallback: Basic pattern matching
      const issues = [];

      // Check for first person
      const firstPerson = /(^|\s)(I|we|my|our|me|us)(\s|'|,|\.)/gi;
      const firstPersonMatches = (content.match(firstPerson) || []).length;
      if (firstPersonMatches > 10) {
        issues.push({
          severity: 'warning',
          message: `Frequent first-person usage (${firstPersonMatches} instances) - consider more objective language`
        });
      }

      // Check for contractions
      const contractions = /(don't|can't|won't|isn't|aren't|wasn't|weren't|doesn't|didn't|haven't|hasn't|wouldn't|shouldn't|couldn't)/gi;
      const contractionMatches = (content.match(contractions) || []).length;
      if (contractionMatches > 0) {
        issues.push({
          severity: 'error',
          message: `Found ${contractionMatches} contractions - use full forms in academic writing`
        });
      }

      // Check for colloquialisms
      const informal = /(a lot|kind of|sort of|basically|literally|stuff|things|gonna|wanna|pretty much)/gi;
      const informalMatches = (content.match(informal) || []).length;
      if (informalMatches > 5) {
        issues.push({
          severity: 'warning',
          message: `Informal language detected (${informalMatches} instances)`
        });
      }

      const score = Math.max(0, 100 - (issues.length * 15));

      return {
        score,
        is_formal: score > 75,
        first_person_usage: firstPersonMatches,
        contractions: contractionMatches,
        informal_language: informalMatches,
        issues,
        suggestions: this.getAcademicToneSuggestions(issues)
      };
    }
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

    const total = scores.reduce((a, b) => a + b, 0);
    console.log(`Overall score calculated: ${total.toFixed(1)}%`);
    return total;
  }

  /**
   * Generate comprehensive suggestions
   */
  async generateComprehensiveSuggestions(analysis, review) {
    const suggestions = [];

    // Critical: High plagiarism
    if (analysis.plagiarism?.plagiarism_score > 25) {
      suggestions.push({
        priority: 'critical',
        category: 'plagiarism',
        title: 'High plagiarism detected',
        description: `${analysis.plagiarism.plagiarism_score.toFixed(1)}% similarity found with existing sources`,
        actions: [
          'Review and paraphrase similar content',
          'Add proper citations for borrowed ideas',
          'Use quotation marks for direct quotes'
        ]
      });
    }

    // High: Missing sections
    if (analysis.structure?.score < 70) {
      suggestions.push({
        priority: 'high',
        category: 'structure',
        title: 'Improve paper structure',
        description: analysis.structure.missing_sections.length > 0
          ? `Missing sections: ${analysis.structure.missing_sections.join(', ')}`
          : 'Paper structure needs improvement',
        actions: analysis.structure.suggestions || []
      });
    }

    // High: Poor methodology
    if (analysis.methodology?.score < 60) {
      suggestions.push({
        priority: 'high',
        category: 'methodology',
        title: 'Strengthen methodology section',
        description: `Missing ${analysis.methodology.missing_elements?.length || 'several'} key elements`,
        actions: analysis.methodology.suggestions || []
      });
    }

    // Medium: Writing quality
    if (analysis.writing_quality?.score < 75) {
      const totalIssues = (analysis.writing_quality.grammar_issues || 0) +
        (analysis.writing_quality.style_issues || 0) +
        (analysis.writing_quality.clarity_issues || 0);
      suggestions.push({
        priority: 'medium',
        category: 'quality',
        title: 'Improve writing quality',
        description: `Found ${totalIssues} grammar, style, and clarity issues`,
        actions: [
          'Review and fix grammar errors',
          'Simplify complex sentences',
          'Use active voice where appropriate',
          'Ensure consistent tense throughout'
        ]
      });
    }

    // Medium: Academic tone
    if (analysis.academic_tone?.score < 80) {
      suggestions.push({
        priority: 'medium',
        category: 'tone',
        title: 'Maintain formal academic tone',
        description: 'Use more formal, objective language',
        actions: analysis.academic_tone.suggestions || []
      });
    }

    // Low: Clarity
    if (analysis.clarity?.score < 70) {
      suggestions.push({
        priority: 'low',
        category: 'clarity',
        title: 'Improve readability',
        description: 'Some sections may be difficult to understand',
        actions: analysis.clarity.suggestions || []
      });
    }

    // Low: Citations
    if (analysis.citations?.score < 90 && analysis.citations?.mismatch > 0) {
      suggestions.push({
        priority: 'low',
        category: 'citations',
        title: 'Fix citation inconsistencies',
        description: `Citation count mismatch: ${analysis.citations.mismatch} difference`,
        actions: analysis.citations.suggestions || []
      });
    }

    // Sort by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
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
      suggestions.push('Verify all in-text citations have corresponding references');
    } else if (references > inText) {
      suggestions.push('Remove unused references or cite them in text');
      suggestions.push('Check for uncited references in your reference list');
    }
    if (inText === 0) {
      suggestions.push('Add citations to support your claims');
      suggestions.push('Reference relevant prior research');
    }
    if (suggestions.length === 0) {
      suggestions.push('Citation formatting looks good');
    }
    return suggestions;
  }

  getReadabilityGrade(score) {
    if (score >= 90) return 'Very Easy (5th grade)';
    if (score >= 80) return 'Easy (6th-7th grade)';
    if (score >= 70) return 'Fairly Easy (8th-9th grade)';
    if (score >= 60) return 'Standard (10th-12th grade)';
    if (score >= 50) return 'Fairly Difficult (College)';
    if (score >= 30) return 'Difficult (College graduate)';
    return 'Very Difficult (Professional)';
  }

  getClarityIssues(avgSentenceLength, complexWordRatio) {
    const issues = [];
    if (avgSentenceLength > 25) {
      issues.push({
        severity: 'warning',
        message: `Long sentences detected (avg ${avgSentenceLength.toFixed(1)} words) - consider breaking them up`
      });
    }
    if (complexWordRatio > 0.2) {
      issues.push({
        severity: 'info',
        message: `High use of complex words (${(complexWordRatio * 100).toFixed(1)}%) - ensure clarity for readers`
      });
    }
    return issues;
  }

  getClaritySuggestions(avgSentenceLength, complexWordRatio) {
    const suggestions = [];
    if (avgSentenceLength > 25) {
      suggestions.push('Break long sentences (>30 words) into shorter ones');
      suggestions.push('Use transition words between sentences');
    }
    if (complexWordRatio > 0.2) {
      suggestions.push('Replace jargon with simpler terms where possible');
      suggestions.push('Define technical terms on first use');
    }
    if (suggestions.length === 0) {
      suggestions.push('Writing clarity is good - maintain current style');
    }
    return suggestions;
  }

  getAcademicToneSuggestions(issues) {
    if (issues.length === 0) {
      return ['Academic tone is appropriate - well done!'];
    }

    return issues.map(issue => {
      if (issue.message.includes('first-person')) {
        return 'Use third person or passive voice for more objective tone';
      }
      if (issue.message.includes('contractions')) {
        return 'Replace all contractions with full forms (do not, cannot, will not)';
      }
      if (issue.message.includes('Informal')) {
        return 'Replace informal language with formal academic alternatives';
      }
      return 'Review and revise for more formal academic language';
    });
  }

  // Additional methods for other endpoints
  async reviewSection(data) {
    return { message: 'Section review functionality coming soon' };
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
      review.status = 'pending';
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