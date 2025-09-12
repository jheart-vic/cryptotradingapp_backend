import Trade from '../models/Trade.js'
import cloudinary from '../utils/cloudinary.js'
import User from '../models/User.js'
import { Readable } from 'stream'
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
      fullName: user.fullName || '',
      profileImage: user.profileImage || '',
      inviteCode: user.inviteCode,
      country: user.country || null,

      bankName: user.bankName,
      bankAccount: user.bankAccount,
      cryptoAddress: user.cryptoAddress,
      spins: user.spins || 0,

      balance: user.balance,
      isVerified: user.isVerified,
      totalDeposit: user.totalDeposit || totalDeposit,
      totalWithdraw: user.totalWithdraw || totalWithdraw,
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
    const referralLink = `https://KubraX.com/register?code=${user.inviteCode}`

    res.json({ referralCode: user.inviteCode, referralLink })
  } catch (err) {
    console.error('Error generating referral info:', err)
    res.status(500).json({ error: 'Failed to fetch referral info' })
  }
}

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id // from auth middleware
    const { fullName } = req.body
    let profileImage = ''

    // Handle image upload if file is present
    if (req.file) {
      const streamUpload = reqFileBuffer => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'user_profiles' },
            (error, result) => {
              if (result) resolve(result)
              else reject(error)
            }
          )
          const readable = new Readable()
          readable._read = () => {}
          readable.push(reqFileBuffer)
          readable.push(null)
          readable.pipe(stream)
        })
      }

      const uploaded = await streamUpload(req.file.buffer)
      profileImage = uploaded.secure_url
    }

    const updatedFields = {}
    if (fullName) updatedFields.fullName = fullName
    if (profileImage) updatedFields.profileImage = profileImage

    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true
    })
    res.json({ msg: 'Profile updated successfully', user: updatedUser })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ msg: 'Failed to update profile' })
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
