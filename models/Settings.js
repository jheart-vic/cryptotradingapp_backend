import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema({
  withdrawEnabled: {
    type: Boolean,
    default: true,
  },
  depositEnabled: {
    type: Boolean,
    default: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
})

export default mongoose.model('Settings', settingsSchema)
