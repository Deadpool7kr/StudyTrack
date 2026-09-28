import mongoose from 'mongoose'

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },

    subject: {
      type: String,
      trim: true,
      default: 'General',
      maxlength: 80
    },

    content: {
      type: String,
      required: true,
      maxlength: 10000
    }
  },
  {
    timestamps: true
  }
)

export default mongoose.model('Note', noteSchema)