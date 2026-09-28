import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({

  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },

  // Original Google account profile photo
  googlePhoto: {
    type: String,
    default: ''
  },

  // Currently selected StudyTrack profile photo
  profilePhoto: {
    type: String,
    default: ''
  },

  profileCompleted: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  lastLogin: {
    type: Date,
    default: Date.now
  }

})

export default mongoose.model('User', userSchema)