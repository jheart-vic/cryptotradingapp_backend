import mongoose from 'mongoose'

const signalSchema = new mongoose.Schema({
  coin: String,             // e.g., BTC/USDT
  direction: String,        // 'call' or 'put'
  duration: Number,         // 60, 120, or 160 seconds
  profitRate: Number,       // 0.3 (30%), 0.4, 0.6
  startTime: Date,
  endTime: Date,
 evaluated: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  createdBy: String         // admin username or ID
})

export default mongoose.model('Signal', signalSchema)
