import mongoose from 'mongoose';

const paperSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Paper title is required'],
    trim: true,
    maxlength: [500, 'Title cannot exceed 500 characters']
  },
  authors: [{
    name: {
      type: String,
      required: true
    },
    affiliation: String,
    email: String
  }],
  abstract: {
    type: String,
    required: [true, 'Abstract is required'],
    maxlength: [5000, 'Abstract cannot exceed 5000 characters']
  },
  keywords: [String],
  publicationDate: Date,
  
  // FIXED: Changed from enum to flexible string to accept any category
  category: {
    type: String,
    default: 'Other',
    index: true
  },
  
  // Source information
  source: {
    type: String,
    enum: ['arXiv', 'PubMed', 'IEEE', 'ACM', 'Springer', 'Nature', 'Science', 'Manual', 'Other'],
    default: 'Manual',
    index: true
  },
  sourceUrl: String,
  
  // Identifiers
  doi: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  arxivId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  pubmedId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // Journal information
  journal: {
    name: String,
    volume: String,
    issue: String,
    pages: String,
    publisher: String
  },
  
  // File storage
  pdfUrl: String,
  pdfPath: String,
  
  // Full text (optional, for search)
  fullText: String,
  
  // AI-generated content
  aiSummary: {
    summary: String,
    keyFindings: [String],
    methodology: String,
    limitations: [String],
    futureWork: [String]
  },
  
  // Embeddings for semantic search
  embeddings: {
    type: [Number],
    select: false // Don't include in queries by default
  },
  
  // References and citations
  references: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper'
  }],
  citedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Paper'
  }],
  citationCount: {
    type: Number,
    default: 0
  },
  
  // Metadata
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  
  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  
  // Version control
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for search and filtering
paperSchema.index({ title: 'text', abstract: 'text', keywords: 'text' });
paperSchema.index({ addedBy: 1, createdAt: -1 });
paperSchema.index({ source: 1, category: 1 });
paperSchema.index({ publicationDate: -1 });

// Virtual for URL-friendly title
paperSchema.virtual('slug').get(function() {
  return this.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-');
});

// Static method to find similar papers
paperSchema.statics.findSimilar = async function(paperId, limit = 10) {
  const paper = await this.findById(paperId);
  if (!paper) throw new Error('Paper not found');
  
  // Simple similarity based on keywords and category
  return this.find({
    _id: { $ne: paperId },
    $or: [
      { keywords: { $in: paper.keywords } },
      { category: paper.category }
    ]
  })
  .limit(limit)
  .select('title authors abstract publicationDate category citationCount');
};

// Static method to search papers
paperSchema.statics.searchPapers = async function(query, options = {}) {
  const {
    category,
    dateFrom,
    dateTo,
    sortBy = '-publicationDate',
    limit = 20,
    skip = 0
  } = options;
  
  const searchQuery = {
    $text: { $search: query }
  };
  
  if (category) {
    searchQuery.category = category;
  }
  
  if (dateFrom || dateTo) {
    searchQuery.publicationDate = {};
    if (dateFrom) searchQuery.publicationDate.$gte = new Date(dateFrom);
    if (dateTo) searchQuery.publicationDate.$lte = new Date(dateTo);
  }
  
  return this.find(searchQuery)
    .select('title authors abstract keywords publicationDate category source citationCount')
    .sort(sortBy)
    .limit(limit)
    .skip(skip);
};

// Instance method to increment view count
paperSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Pre-save middleware
paperSchema.pre('save', function(next) {
  // Ensure keywords are lowercase and unique
  if (this.keywords) {
    this.keywords = [...new Set(this.keywords.map(k => k.toLowerCase()))];
  }
  next();
});

const Paper = mongoose.model('Paper', paperSchema);

export default Paper;