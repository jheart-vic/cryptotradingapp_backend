import mongoose from 'mongoose'

const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  signalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Signal', required: true },

  coin: { type: String, required: true },
  amount: { type: Number, default: 0 },

  direction: { type: String, enum: ['call', 'put'], required: true },
  duration: { type: Number, required: true },

  tradeEndTime: { type: Date, required: true },
  placedAt: { type: Date, default: Date.now },

 result: { type: String, enum: ['win', 'lose'], required: true },

  profit: { type: Number, default: 0 }
})

export default mongoose.model('Trade', tradeSchema)

