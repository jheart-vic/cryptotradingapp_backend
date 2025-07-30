import Trade from "../models/Trade"
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password')
    if (!user) return res.status(404).json({ msg: 'User not found' })

    // Fetch totals from transactions (optional if you trust User fields)
    const [deposits, withdrawals] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId: user._id, type: 'deposit', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Transaction.aggregate([
        { $match: { userId: user._id, type: 'withdraw', status: 'approved' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ])

    const totalDeposit = deposits[0]?.total || 0
    const totalWithdraw = withdrawals[0]?.total || 0

    res.json({
      username: user.username,
      email: user.email,
      phone: user.phone,
      country: user.country || null,

      bankName: user.bankName,
      bankAccount: user.bankAccount,
      cryptoAddress: user.cryptoAddress,

      balance: user.balance,
      totalDeposit,
      totalWithdraw,

      level: user.level,
      hasTraded: user.hasTraded,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const getReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('inviteCode')

    if (!user || !user.inviteCode) {
      return res.status(404).json({ error: 'Referral code not found' })
    }

    // Generate the referral link
    const referralLink = `https://adm-worldwide.com/register?code=${user.inviteCode}`

    res.json({ referralCode: user.inviteCode, referralLink })
  } catch (err) {
    console.error('Error generating referral info:', err)
    res.status(500).json({ error: 'Failed to fetch referral info' })
  }
}


export const getUserTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ userId: req.user._id })
      .populate('signalId')
      .sort({ placedAt: -1 })
    res.json(trades)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
