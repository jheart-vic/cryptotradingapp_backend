import mongoose from 'mongoose'

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  type: { type: String, enum: ['deposit', 'withdraw'], required: true },
  amount: { type: Number, required: true },

  method: { type: String },
  walletAddress: String,
  bankName: String,
  accountNumber: String,
  // merchantOrderId: { type: String, unique: true },

  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  gatewayResponse: { type: Object },
  gatewayOrderId: { type: String },

  createdAt: { type: Date, default: Date.now },
  approvedAt: Date
})

export default mongoose.model('Transaction', transactionSchema)
