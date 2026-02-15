import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['abstract', 'introduction', 'literature_review', 'methodology', 'results', 'discussion', 'conclusion', 'references', 'other'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  wordCount: Number
});

const paperReviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Paper details
  title: {
    type: String,
    required: true
  },
  abstract: String,
  sections: [sectionSchema],
  
  // File upload
  filePath: String,
  fileName: String,
  fileSize: Number,
  
  // Review status
  status: {
    type: String,
    enum: ['pending', 'analyzing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Analysis results
  analysis: {
    overall_score: Number,
    
    structure: {
      score: Number,
      has_all_sections: Boolean,
      missing_sections: [String],
      present_sections: [String],
      issues: [{
        severity: String,
        message: String
      }],
      suggestions: [String]
    },
    
    writing_quality: {
      score: Number,
      grammar_issues: Number,
      style_issues: Number,
      clarity_issues: Number,
      details: mongoose.Schema.Types.Mixed
    },
    
    citations: {
      score: Number,
      in_text_citations: Number,
      reference_count: Number,
      mismatch: Number,
      issues: [{
        severity: String,
        message: String
      }],
      suggestions: [String]
    },
    
    plagiarism: {
      score: Number,
      plagiarism_score: Number,
      matches: Number,
      level: String,
      details: mongoose.Schema.Types.Mixed
    },
    
    methodology: {
      score: Number,
      completeness: String,
      has_all_elements: Boolean,
      missing_elements: [String],
      issues: [{
        severity: String,
        message: String
      }],
      suggestions: [String]
    },
    
    clarity: {
      score: Number,
      readability_grade: String,
      avg_sentence_length: String,
      avg_word_length: String,
      complex_word_ratio: String,
      issues: [{
        severity: String,
        message: String
      }],
      suggestions: [String]
    },
    
    academic_tone: {
      score: Number,
      is_formal: Boolean,
      first_person_usage: Number,
      contractions: Number,
      informal_language: Number,
      issues: [{
        severity: String,
        message: String
      }],
      suggestions: [String]
    },
    
    suggestions: [{
      priority: {
        type: String,
        enum: ['critical', 'high', 'medium', 'low']
      },
      category: String,
      title: String,
      description: String,
      actions: [String]
    }],
    
    timestamp: Date
  },
  
  // Timestamps
  submittedAt: Date,
  completedAt: Date,
  
  // User feedback
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: String,
  
  // Revision tracking
  revisionNumber: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    versionNumber: Number,
    analysis: mongoose.Schema.Types.Mixed,
    revisedAt: Date
  }]
}, {
  timestamps: true
});

// Indexes
paperReviewSchema.index({ userId: 1, createdAt: -1 });
paperReviewSchema.index({ status: 1 });
paperReviewSchema.index({ 'analysis.overall_score': 1 });

// Virtual for overall progress
paperReviewSchema.virtual('progress').get(function() {
  if (this.status === 'completed') return 100;
  if (this.status === 'analyzing') return 50;
  if (this.status === 'pending') return 0;
  return 0;
});

// Method to get summary
paperReviewSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    status: this.status,
    overallScore: this.analysis?.overall_score,
    submittedAt: this.submittedAt,
    completedAt: this.completedAt
  };
};

// Static method to get user statistics
paperReviewSchema.statics.getUserStats = async function(userId) {
  const reviews = await this.find({ userId, status: 'completed' });
  
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      averageScore: 0,
      improvements: 0
    };
  }
  
  const scores = reviews.map(r => r.analysis?.overall_score || 0);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Calculate improvement (comparing first vs last)
  const improvement = scores.length > 1 
    ? scores[scores.length - 1] - scores[0]
    : 0;
  
  return {
    totalReviews: reviews.length,
    averageScore: avgScore.toFixed(1),
    improvement: improvement.toFixed(1),
    lastReview: reviews[reviews.length - 1].completedAt
  };
};

const PaperReview = mongoose.model('PaperReview', paperReviewSchema);

export default PaperReview;