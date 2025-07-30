import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  amount: { type: Number, required: true },

  method: { type: String }, // e.g., 'crypto', 'bank'
  walletAddress: String,
  bankName: String,
  accountNumber: String,

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  createdAt: { type: Date, default: Date.now },
  approvedAt: Date
})

export default mongoose.model('Transaction', transactionSchema)
