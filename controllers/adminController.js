import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import Transaction from '../models/Transaction.js'
import Signal from '../models/Signal.js'
import { DateTime } from 'luxon'
import History from '../models/History.js'
import { coinIdMap } from '../utils/coinGeckoMap.js'
import Settings from '../models/Settings.js'
import Trade from '../models/Trade.js'
import mongoose from 'mongoose'
import Announcement from '../models/Announcement.js';

     //Admin Auth
//  Registration
export const registerAdmin = async (req, res) => {
  const { email, password } = req.body

  try {
    // Check if already exists
    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ error: 'Admin already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)

    const admin = await User.create({
      email,
      password: hashed,
      role: 'admin',
      isVerified: true
    })

    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    })
  } catch (err) {
    console.error('Admin registration error:', err)
    res.status(500).json({ error: 'Server error while creating admin' })
  }
}

// Admin Login
export const loginAdmin = async (req, res) => {
  const { email, password } = req.body

  try {
    const admin = await User.findOne({ email, role: 'admin' })
    if (!admin) return res.status(404).json({ error: 'Admin not found' })

    const isMatch = await bcrypt.compare(password, admin.password)
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    })
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ error: 'Server error during login' })
  }
}

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
    const { coin, direction, duration, profitRate } = req.body

    if (!coin || !direction || !duration || !profitRate) {
      return res.status(400).json({ msg: 'All fields are required' })
    }

      const baseSymbol = coin?.split('/')?.[0]?.trim().toUpperCase()
    const coingeckoId = coinIdMap[baseSymbol]
    if (!coingeckoId) {
      return res.status(400).json({ msg: `CoinGecko ID not found for symbol ${baseSymbol}` })
    }

    const startTime = DateTime.now().setZone('Africa/Lagos')
    const endTime = startTime.plus({ hours: 2 })

    const signal = await Signal.create({
      coin,
      coingeckoId, // ✅ Store here
      direction,
      duration,
      profitRate,
      startTime: startTime.toJSDate(),
      endTime: endTime.toJSDate(),
      createdBy: req.user._id,
    })

    res.json({ msg: 'Signal created', signal }) // ✅ now includes coingeckoId
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

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ msg: 'Invalid user ID' })
  }

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ msg: 'User not found' })

    user.balance += Number(amount)
    await user.save()

    await History.create({
      user: user._id,
      type: 'bonus',
      amount,
      message: message || `Bonus of ₦${amount} received from Admin`,
    })

    res.json({ msg: `₦${amount} added to user balance`, user })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

// Admin gives a spin to a user
export const giveSpin = async (req, res) => {
  const { phone, spins = 1 } = req.body

  const user = await User.findOne({ phone })
  if (!user) return res.status(404).json({ message: 'User not found' })

  user.spins += spins
  await user.save()
 await History.create({
    user: user._id,
    type: 'spin-reward',
    message: `You won 1 spin wheel from admin`,
  })
  res.json({ message: `${spins} spin(s) given to ${user.username}`, currentSpins: user.spins })
}

// Get recent deposits and withdrawals for admin dashboard
export const getRecentActivities = async (req, res) => {
  try {
    const deposits = await Transaction.find({ type: 'deposit' })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(5);

    const withdrawals = await Transaction.find({ type: 'withdraw' })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recent = [...deposits, ...withdrawals]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6); // combine and take top 6 most recent

    res.json(recent);
  } catch (err) {
    res.status(500).json({ msg: err.message });
}
};

// Get all announcements
export const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.status(200).json(announcements);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch announcements' });
  }
};

// Create a new announcement
export const createAnnouncement = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: 'Title and message are required' });
  }

  try {
    const announcement = await Announcement.create({
      title,
      message,
      createdBy: req.user?._id,
    });

    const users = await User.find({ isAdmin: { $ne: true } }, '_id');

    const histories = users.map((user) => ({
      user: user._id,
      type: 'announcement',
      amount: 0,
      message: `📢 ${title} — ${message}`,
    }));

    await History.insertMany(histories);

    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create announcement' });
  }
};

// Delete an announcement
export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;

  try {
    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.status(200).json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete announcement' });
  }
};
