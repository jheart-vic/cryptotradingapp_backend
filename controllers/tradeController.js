// controllers/tradeController.js
import Trade from '../models/Trade.js'
import Signal from '../models/Signal.js'
import User from '../models/User.js'
import { DateTime } from 'luxon'
// import { applyReferralBonus } from '../utils/referralBonus.js'
import History from '../models/History.js'

export const placeTrade = async (req, res) => {
  try {
    const { signalId, amount, direction, duration } = req.body;
    const userId = req.user._id;

    const signal = await Signal.findById(signalId);
    if (!signal || !signal.isActive) {
      return res.status(400).json({ msg: 'Invalid or expired signal' });
    }

    const now = DateTime.now().setZone('Africa/Lagos');
    if (now.toJSDate() > signal.endTime) {
      return res.status(400).json({ msg: 'Signal already expired' });
    }

    const placedAt = now;
    const tradeEndTime = placedAt.plus({ seconds: Number(duration) });

    const existingTrade = await Trade.findOne({ userId, signalId });
    if (existingTrade) {
      return res.status(400).json({ msg: 'Trade already placed on this signal' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }

    const tradeAmount = typeof amount === 'number' && amount > 0 ? amount : user.balance;

    if (tradeAmount <= 0) {
      return res.status(400).json({ msg: 'Insufficient balance or invalid trade amount' });
    }

    if (user.balance < tradeAmount) {
      return res.status(400).json({ msg: 'Insufficient balance' });
    }

    // Deduct the amount
    user.balance -= tradeAmount;
    user.hasTraded = true;

    let result = 'win';
    let profit = 0;
    let lossReason = '';

    // Evaluate mismatch
    const directionMatch = direction === signal.direction;
    const durationMatch = Number(duration) === signal.duration;

    if (!directionMatch || !durationMatch) {
      result = 'lose';
      if (!directionMatch && !durationMatch) {
        lossReason = 'Direction and duration mismatch';
      } else if (!directionMatch) {
        lossReason = 'Direction mismatch';
      } else {
        lossReason = 'Duration mismatch';
      }
    } else {
      // Calculate profit
      profit = tradeAmount * signal.profitRate;
      user.balance += tradeAmount + profit;
    }

    await user.save();

    const trade = await Trade.create({
      userId,
      signalId,
      coin: signal.coin,
      amount: tradeAmount,
      direction,
      duration: Number(duration),
      placedAt: placedAt.toJSDate(),
      tradeEndTime: tradeEndTime.toJSDate(),
      result,
      profit
    });

    await History.create({
      user: user._id,
      type: 'trade',
      amount: result === 'win' ? profit : 0,
      message:
        result === 'win'
          ? `Trade won on ${signal.coin}, earned ₦${profit}`
          : `Trade lost on ${signal.coin}. Reason: ${lossReason}`
    });

    return res.json({ msg: 'Trade placed and evaluated', trade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};


export const getUserTrades = async (req, res) => {
  try {
    const userId = req.user._id
    const trades = await Trade.find({ userId }).sort({ createdAt: -1 })
    res.json(trades)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
