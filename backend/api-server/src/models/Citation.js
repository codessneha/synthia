import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    // Owner
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Citation Source
    paper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Paper'
    },
    
    // Manual Citation Data (if paper not in database)
    manualEntry: {
      title: String,
      authors: [String],
      year: Number,
      journal: String,
      volume: String,
      issue: String,
      pages: String,
      publisher: String,
      doi: String,
      url: String,
      accessDate: Date
    },
    
    // Citation Format
    format: {
      type: String,
      enum: [
        'IEEE', 'APA', 'MLA', 'Chicago', 'Harvard',
        'Vancouver', 'ACS', 'AMA', 'ASA', 'AAA',
        'Springer', 'Elsevier', 'Nature', 'Science', 'ACM'
      ],
      required: true
    },
    
    // Generated Citations
    formattedCitation: {
      type: String,
      required: true
    },
    bibTeX: String,
    risFormat: String,
    endnoteXML: String,
    
    // Organization
    project: {
      type: String,
      trim: true
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    notes: String,
    
    // Usage
    usedIn: [{
      documentName: String,
      documentType: {
        type: String,
        enum: ['paper', 'thesis', 'report', 'presentation', 'other']
      },
      usedAt: {
        type: Date,
        default: Date.now
      }
    }],
    
    // Metadata
    isPublic: {
      type: Boolean,
      default: false
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
citationSchema.index({ user: 1, createdAt: -1 });
citationSchema.index({ user: 1, project: 1 });
citationSchema.index({ user: 1, tags: 1 });
citationSchema.index({ paper: 1 });

// Static method to generate formatted citation
citationSchema.statics.generateCitation = function(paperData, format) {
  // This is a simplified version - in production, use a proper citation library
  const { title, authors, year, journal, volume, pages, doi } = paperData;
  const authorString = authors.join(', ');
  
  let formatted = '';
  
  switch(format) {
    case 'IEEE':
      formatted = `${authorString}, "${title}," ${journal}, vol. ${volume}, pp. ${pages}, ${year}.`;
      if (doi) formatted += ` doi: ${doi}`;
      break;
      
    case 'APA':
      formatted = `${authorString} (${year}). ${title}. ${journal}, ${volume}, ${pages}.`;
      if (doi) formatted += ` https://doi.org/${doi}`;
      break;
      
    case 'MLA':
      formatted = `${authorString}. "${title}." ${journal} ${volume} (${year}): ${pages}.`;
      break;
      
    case 'Chicago':
      formatted = `${authorString}. "${title}." ${journal} ${volume} (${year}): ${pages}.`;
      break;
      
    case 'Harvard':
      formatted = `${authorString}, ${year}. ${title}. ${journal}, ${volume}, pp.${pages}.`;
      break;
      
    default:
      formatted = `${authorString} (${year}). ${title}. ${journal}, ${volume}, ${pages}.`;
  }
  
  return formatted;
};

// Static method to generate BibTeX
citationSchema.statics.generateBibTeX = function(paperData, citationKey) {
  const { title, authors, year, journal, volume, pages, doi } = paperData;
  const authorString = authors.join(' and ');
  
  return `@article{${citationKey},
  author = {${authorString}},
  title = {${title}},
  journal = {${journal}},
  volume = {${volume}},
  pages = {${pages}},
  year = {${year}},
  doi = {${doi || ''}}
}`;
};

// Method to add usage record
citationSchema.methods.addUsage = function(documentName, documentType) {
  this.usedIn.push({
    documentName,
    documentType,
    usedAt: new Date()
  });
  return this.save();
};

const Citation = mongoose.model('Citation', citationSchema);

export default Citation;