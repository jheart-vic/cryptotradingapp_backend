// models/History.js
import mongoose from 'mongoose'

const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'bonus',
      'deposit',
      'withdrawal',
      'trade',
      'salary',
      'spin-reward',
      'announcement'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: function () {
      return ['deposit', 'withdrawal', 'bonus', 'salary', 'trade'].includes(
        this.type
      )
    }
  },
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
})

export default mongoose.model('History', historySchema)
