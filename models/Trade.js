import mongoose from 'mongoose'

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  signalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signal' },

  coin: String,
  amount: Number,
  direction: String,       // 'call' or 'put'
  duration: Number,
  placedAt: { type: Date, default: Date.now },

  result: { type: String, enum: ['win', 'lose', 'pending'], default: 'pending' },
  profit: { type: Number, default: 0 }
})

export default mongoose.model('Trade', tradeSchema)
