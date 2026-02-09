import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema(
  {
    // Paper Identifiers
    title: {
      type: String,
      required: [true, 'Paper title is required'],
      trim: true,
      index: 'text' // Enable text search
    },
    doi: {
      type: String,
      sparse: true, // Allows null but unique if present
      index: true
    },
    arxivId: {
      type: String,
      sparse: true,
      index: true
    },
    pubmedId: {
      type: String,
      sparse: true,
      index: true
    },
    
    // Authors
    authors: [{
      name: {
        type: String,
        required: true
      },
      affiliation: String,
      email: String
    }],
    
    // Publication Details
    abstract: {
      type: String,
      required: [true, 'Abstract is required']
    },
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    publicationDate: {
      type: Date,
      index: true
    },
    journal: {
      name: String,
      volume: String,
      issue: String,
      pages: String,
      publisher: String
    },
    conference: {
      name: String,
      location: String,
      date: Date
    },
    
    // Classification
    category: {
      type: String,
      enum: ['Computer Science', 'Physics', 'Mathematics', 'Biology', 
             'Chemistry', 'Medicine', 'Engineering', 'Social Sciences', 'Other'],
      default: 'Other'
    },
    subcategory: String,
    fieldOfStudy: [String],
    
    // Content
    pdfUrl: String,
    pdfPath: String, // Local storage path if downloaded
    fullText: {
      type: String,
      select: false // Don't include by default due to size
    },
    
    // Metadata
    source: {
      type: String,
      enum: ['arXiv', 'PubMed', 'IEEE', 'ACM', 'Springer', 'Nature', 
             'Science', 'Manual', 'Other'],
      required: true
    },
    sourceUrl: String,
    language: {
      type: String,
      default: 'en'
    },
    
    // Citations
    citationCount: {
      type: Number,
      default: 0
    },
    references: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    }],
    citedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    }],
    
    // AI-Generated Content
    aiSummary: {
      shortSummary: String, // 2-3 sentences
      detailedSummary: String, // 1-2 paragraphs
      keyFindings: [String],
      methodology: String,
      contributions: [String],
      limitations: [String]
    },
    
    // Embeddings for semantic search
    embeddings: {
      type: [Number],
      select: false // Large array, don't fetch by default
    },
    embeddingModel: {
      type: String,
      default: 'text-embedding-ada-002'
    },
    
    // User Interactions
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    viewCount: {
      type: Number,
      default: 0
    },
    downloadCount: {
      type: Number,
      default: 0
    },
    
    // Status
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    
    // Versions (for papers that get updated)
    version: {
      type: Number,
      default: 1
    },
    previousVersions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
paperSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });
paperSchema.index({ addedBy: 1, createdAt: -1 });
paperSchema.index({ publicationDate: -1 });
paperSchema.index({ category: 1, publicationDate: -1 });
paperSchema.index({ source: 1, sourceUrl: 1 });

// Virtual for citation formatted string
paperSchema.virtual('citationFormatted').get(function() {
  const authors = this.authors.map(a => a.name).join(', ');
  const year = this.publicationDate ? this.publicationDate.getFullYear() : 'n.d.';
  return `${authors} (${year}). ${this.title}.`;
});

// Virtual for author count
paperSchema.virtual('authorCount').get(function() {
  return this.authors.length;
});

// Pre-save middleware to update embeddings flag
paperSchema.pre('save', function(next) {
  if (this.isModified('embeddings') && this.embeddings && this.embeddings.length > 0) {
    this.processingStatus = 'completed';
  }
  next();
});

// Static method to find similar papers (based on keywords/category)
paperSchema.statics.findSimilar = function(paperId, limit = 10) {
  return this.findById(paperId)
    .then(paper => {
      if (!paper) return [];
      return this.find({
        _id: { $ne: paperId },
        $or: [
          { keywords: { $in: paper.keywords } },
          { category: paper.category }
        ]
      })
      .limit(limit)
      .select('title authors publicationDate abstract keywords category')
      .sort({ citationCount: -1 });
    });
};

// Static method to search papers
paperSchema.statics.searchPapers = function(query, options = {}) {
  const {
    category,
    dateFrom,
    dateTo,
    sortBy = '-publicationDate',
    limit = 20,
    skip = 0
  } = options;

  const filter = {
    $text: { $search: query }
  };

  if (category) filter.category = category;
  if (dateFrom || dateTo) {
    filter.publicationDate = {};
    if (dateFrom) filter.publicationDate.$gte = new Date(dateFrom);
    if (dateTo) filter.publicationDate.$lte = new Date(dateTo);
  }

  return this.find(filter)
    .select('title authors abstract keywords publicationDate category citationCount')
    .sort(sortBy)
    .limit(limit)
    .skip(skip);
};

// Method to increment view count
paperSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;