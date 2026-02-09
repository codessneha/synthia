import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    // Session Info
    name: {
      type: String,
      required: [true, 'Session name is required'],
      trim: true,
      maxlength: [100, 'Session name cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    
    // Owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Papers in this session
    papers: [{
      paper: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper',
        required: true
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      notes: String,
      highlights: [{
        text: String,
        page: Number,
        color: String,
        createdAt: { type: Date, default: Date.now }
      }]
    }],
    
    // Session Type
    sessionType: {
      type: String,
      enum: ['single-paper', 'multi-paper', 'comparative', 'literature-review'],
      default: 'single-paper'
    },
    
    // Chat Messages
    messages: [{
      role: {
        type: String,
        enum: ['user', 'assistant', 'system'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      metadata: {
        model: String, // Which AI model was used
        tokens: Number,
        citations: [{
          paperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Paper'
          },
          text: String,
          page: Number
        }]
      }
    }],
    
    // Session Context (for AI memory)
    context: {
      summary: String, // Summary of conversation so far
      keyTopics: [String],
      focusPapers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Paper'
      }],
      userIntent: String // Research question/goal
    },
    
    // Settings
    settings: {
      aiModel: {
        type: String,
        enum: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
        default: 'gpt-4'
      },
      temperature: {
        type: Number,
        min: 0,
        max: 2,
        default: 0.7
      },
      maxTokens: {
        type: Number,
        default: 2000
      },
      includeReferences: {
        type: Boolean,
        default: true
      }
    },
    
    // Collaboration
    sharedWith: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      permission: {
        type: String,
        enum: ['view', 'comment', 'edit'],
        default: 'view'
      },
      sharedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    
    // Tags and Organization
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    folder: String,
    
    // Status
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
      index: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    
    // Analytics
    stats: {
      messageCount: {
        type: Number,
        default: 0
      },
      totalTokensUsed: {
        type: Number,
        default: 0
      },
      lastActivityAt: Date,
      viewCount: {
        type: Number,
        default: 0
      }
    },
    
    // Export History
    exports: [{
      format: {
        type: String,
        enum: ['pdf', 'docx', 'markdown', 'json']
      },
      exportedAt: {
        type: Date,
        default: Date.now
      },
      fileUrl: String
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
sessionSchema.index({ user: 1, createdAt: -1 });
sessionSchema.index({ user: 1, status: 1, isPinned: -1, updatedAt: -1 });
sessionSchema.index({ tags: 1 });
sessionSchema.index({ 'papers.paper': 1 });

// Virtual for paper count
sessionSchema.virtual('paperCount').get(function() {
  return this.papers.length;
});

// Virtual for message count (alternative to storing in stats)
sessionSchema.virtual('messageCount').get(function() {
  return this.messages.length;
});

// Pre-save middleware to update stats
sessionSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.stats.messageCount = this.messages.length;
    this.stats.lastActivityAt = new Date();
    
    // Calculate total tokens
    this.stats.totalTokensUsed = this.messages.reduce((sum, msg) => {
      return sum + (msg.metadata?.tokens || 0);
    }, 0);
  }
  next();
});

// Method to add a message
sessionSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    timestamp: new Date(),
    metadata
  });
  return this.save();
};

// Method to add a paper
sessionSchema.methods.addPaper = function(paperId, notes = '') {
  // Check if paper already exists in session
  const exists = this.papers.some(p => p.paper.toString() === paperId.toString());
  
  if (!exists) {
    this.papers.push({
      paper: paperId,
      addedAt: new Date(),
      notes
    });
  }
  
  return this.save();
};

// Method to remove a paper
sessionSchema.methods.removePaper = function(paperId) {
  this.papers = this.papers.filter(p => p.paper.toString() !== paperId.toString());
  return this.save();
};

// Static method to get user sessions with filters
sessionSchema.statics.getUserSessions = function(userId, options = {}) {
  const {
    status = 'active',
    sortBy = '-updatedAt',
    limit = 20,
    skip = 0,
    tags,
    search
  } = options;

  const query = { user: userId, status };
  
  if (tags && tags.length > 0) {
    query.tags = { $in: tags };
  }
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  return this.find(query)
    .populate('papers.paper', 'title authors publicationDate')
    .sort(sortBy)
    .limit(limit)
    .skip(skip);
};

// Static method to get session with full details
sessionSchema.statics.getSessionDetails = function(sessionId, userId) {
  return this.findOne({ _id: sessionId, user: userId })
    .populate('papers.paper')
    .populate('sharedWith.user', 'name email profilePicture');
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;