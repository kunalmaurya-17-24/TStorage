const mongoose = require('mongoose')
const crypto = require('crypto')

const FileSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  expiresAt: { type: Date, default: null },
  deletionTimer: { type: Number, default: 60 },

  // Remove unique constraint for shareableLink
  shareableLink: { 
    type: String, 
    default: null 
  },
  isShareable: { 
    type: Boolean, 
    default: false 
  },

  // New fields for share tokens
  shareToken: {
    type: String,
    default: null
  },
  shareTokenExpires: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// Pre-save hook to generate shareableLink if not exists
FileSchema.pre('save', function(next) {
  // Only generate shareableLink if it doesn't exist
  if (!this.shareableLink) {
    // Generate a unique shareable link
    this.shareableLink = crypto.randomBytes(16).toString('hex')
  }

  // Generate shareToken if not exists and isShareable is true
  if (this.isShareable && !this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString('hex')
    this.shareTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
  }

  next()
})

// Create a compound index to prevent duplicate shareableLinks for shareable files
FileSchema.index({ shareableLink: 1, isShareable: 1 }, { 
  unique: true, 
  partialFilterExpression: { isShareable: true } 
})

module.exports = mongoose.model('File', FileSchema)
