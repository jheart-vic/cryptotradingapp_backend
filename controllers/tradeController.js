// controllers/tradeController.js
import Trade from '../models/Trade.js'
import Signal from '../models/Signal.js'
import User from '../models/User.js'
import { DateTime } from 'luxon'
import { applyReferralBonus } from '../utils/referralBonus.js'


export const placeTrade = async (req, res) => {
  try {
    const { signalId, amount, direction } = req.body
    const userId = req.user._id

    const signal = await Signal.findById(signalId)
    if (!signal || !signal.isActive) {
      return res.status(400).json({ msg: 'Invalid or expired signal' })
    }

    const now = DateTime.now().setZone('Africa/Lagos').toJSDate()
    if (now > signal.endTime) {
      return res.status(400).json({ msg: 'Signal already expired' })
    }

    // ✅ Check if direction matches signal
    if (direction !== signal.direction) {
      return res.status(400).json({ msg: 'Invalid trade direction for this signal' })
    }

    const existingTrade = await Trade.findOne({ userId, signalId })
    if (existingTrade) {
      return res.status(400).json({ msg: 'Trade already placed on this signal' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(400).json({ msg: 'User not found' })
    }

    const tradeAmount = typeof amount === 'number' && amount > 0 ? amount : user.balance

    if (tradeAmount <= 0) {
      return res.status(400).json({ msg: 'Insufficient balance or invalid trade amount' })
    }

    if (user.balance < tradeAmount) {
      return res.status(400).json({ msg: 'Insufficient balance' })
    }

    // Deduct balance and update user
    user.balance -= tradeAmount
    user.hasTraded = true
    await user.save()

    // Create trade
    const trade = await Trade.create({
      userId,
      signalId,
      coin: signal.coin,
      amount: tradeAmount,
      direction: signal.direction,
      duration: signal.duration
    })

    // Referral bonus
    await applyReferralBonus(userId, tradeAmount)

    res.json({ msg: 'Trade placed successfully', trade })

  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: err.message })
  }
}

export const getUserTrades = async (req, res) => {
  try {
    const userId = req.user._id
    const trades = await Trade.find({ userId }).sort({ createdAt: -1 })
    res.json(trades)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
