import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },

  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  inviteCode: { type: String, unique: true, sparse: true },
  invitedBy: { type: String, default: null },

  level: { type: Number, default: 0 },

  balance: { type: Number, default: 0 },
  totalDeposit: { type: Number, default: 0 },
  totalWithdraw: { type: Number, default: 0 },

  cryptoAddress: { type: String, default: '' },
  bankName: { type: String, default: '' },
  bankAccount: { type: String, default: '' },

  isVerified: { type: Boolean, default: false },
  verificationCode: String,
  verificationCodeExpires: Date,
  resetCode: String,
  resetCodeExpires: Date,
  hasTraded: { type: Boolean, default: false },
  spins: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema)
