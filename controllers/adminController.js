import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import Signal from '../models/Signal.js'
import History from '../models/History.js'
import Settings from '../models/Settings.js'
import Trade from '../models/Trade.js'

// 1. Dashboard overview
export const getAdminDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const totalInvested = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    const totalBalance = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$balance' } } }
    ])

    res.json({
      totalUsers,
      totalInvested: totalInvested[0]?.total || 0,
      totalBalance: totalBalance[0]?.total || 0
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// 2. Manage customers
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json(users)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ msg: 'User deleted' })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const toggleUserHold = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    user.isHeld = !user.isHeld
    await user.save()
    res.json({ msg: `User is now ${user.isHeld ? 'held' : 'active'}` })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}



export const impersonateUser = async (req, res) => {
  const { userId } = req.params

  try {
    const admin = req.user
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ msg: 'Unauthorized' })
    }

    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ msg: 'User not found' })

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role || 'user'
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    res.json({
      msg: `You are now impersonating ${user.username}`,
      token,
      user
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// 3. Trade Records
export const getAllTrades = async (req, res) => {
  try {
    const { search } = req.query

    let userFilter = {}

    if (search) {
      const regex = new RegExp(search, 'i') // case-insensitive search
      const users = await User.find(
        {
          $or: [{ username: regex }, { phone: regex }, { email: regex }]
        },
        '_id'
      )

      const userIds = users.map(u => u._id)
      userFilter.userId = { $in: userIds }
    }

    const records = await Trade.find(userFilter)
      .populate('userId', 'username phone email') // Use userId not 'user'
      .sort({ createdAt: -1 })

    res.json(records)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// 4. Customer payments (deposits)
export const getAllDeposits = async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit' })
      .populate('user')
      .sort({ createdAt: -1 })
    res.json(deposits)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// 5. Customer withdrawals
export const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Transaction.find({ type: 'withdraw' })
      .populate('user')
      .sort({ createdAt: -1 })
    res.json(withdrawals)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// 6. Deposit/Withdrawal Switch
export const toggleSwitch = async (req, res) => {
  const { type } = req.params // 'deposit' or 'withdrawal'

  const fieldMap = {
    deposit: 'depositEnabled',
    withdrawal: 'withdrawEnabled'
  }

  const fieldName = fieldMap[type]
  if (!fieldName) {
    return res.status(400).json({ msg: 'Invalid type' })
  }

  try {
    const setting = (await Settings.findOne()) || (await Settings.create({}))
    setting[fieldName] = !setting[fieldName]
    await setting.save()

    res.json({
      msg: `${type} is now ${setting[fieldName] ? 'enabled' : 'disabled'}`
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const getSwitches = async (req, res) => {
  try {
    const setting = await Settings.findOne()
    res.json({
      deposit: setting?.depositEnabled ?? true,
      withdrawal: setting?.withdrawEnabled ?? true
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// 7. Signal Generation
export const createSignal = async (req, res) => {
  try {
    const { currencyPair, direction, startTime, endTime } = req.body
    const signal = await Signal.create({
      currencyPair,
      direction,
      startTime,
      endTime
    })
    res.json({ msg: 'Signal created', signal })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const getSignalHistory = async (req, res) => {
  try {
    const signals = await Signal.find().sort({ startTime: -1 })
    res.json(signals)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const addUserBonus = async (req, res) => {
  const { userId } = req.params
  const { amount, message } = req.body
  const admin = req.user

  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ msg: 'Unauthorized' })
  }

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ msg: 'User not found' })

    user.balance += Number(amount)
    await user.save()

    await History.create({
      user: user._id,
      type: 'admin-bonus',
      amount,
      message: message || `Bonus of ₦${amount} received from Admin`,
    })

    res.json({ msg: `₦${amount} added to user balance`, user })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}