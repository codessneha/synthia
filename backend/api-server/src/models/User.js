const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'researcher'],
      default: 'user'
    },
    profilePicture: {
      type: String,
      default: null
    },
    institution: {
      type: String,
      default: null
    },
    researchInterests: [{
      type: String,
      trim: true
    }],
    preferences: {
      citationFormat: {
        type: String,
        enum: ['IEEE', 'APA', 'MLA', 'Chicago', 'Harvard'],
        default: 'IEEE'
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto'
      },
      notifications: {
        email: { type: Boolean, default: true },
        inApp: { type: Boolean, default: true }
      }
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });

// Virtual for sessions
userSchema.virtual('sessions', {
  ref: 'Session',
  localField: '_id',
  foreignField: 'user'
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  try {
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to generate auth token payload
userSchema.methods.getAuthPayload = function() {
  return {
    id: this._id,
    email: this.email,
    role: this.role,
    name: this.name
  };
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model('User', userSchema);

module.exports = User;