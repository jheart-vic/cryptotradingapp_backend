import mongoose from 'mongoose'

const signalSchema = new mongoose.Schema({
  coin: String, // e.g., BTC/USDT
  direction: {
    type: String,
    enum: ['call', 'put'],
    required: true
  },
  duration: {
    type: Number,
    enum: [60, 120, 180],
    required: true
  },
  profitRate: Number, // 0.3 (30%), 0.4, 0.6
  startTime: Date,
  endTime: Date,
  coingeckoId: {
    type: String,
    required: true
  },

  evaluated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: String // admin username or ID
})

export default mongoose.model('Signal', signalSchema)
