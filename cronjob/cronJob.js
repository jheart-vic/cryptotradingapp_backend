import cron from 'node-cron'
import { DateTime } from 'luxon'
import Trade from '../models/Trade.js'
import Signal from '../models/Signal.js'
import User from '../models/User.js'
import History from '../models/History.js'

const ZONE = 'Africa/Lagos'

export const startTradingCrons = () => {
  cron.schedule('*/10 * * * * *', async () => {
    const now = DateTime.now().setZone(ZONE).toJSDate()

    // ✅ 1. DEACTIVATE expired signals
    const expiredSignals = await Signal.find({
      endTime: { $lte: now },
      isActive: true,
    })

    for (const signal of expiredSignals) {
      signal.isActive = false
      signal.evaluated = true
      await signal.save()
    }

    // ✅ 2. EVALUATE completed trades
    const expiredTrades = await Trade.find({
      tradeEndTime: { $lte: now },
      result: 'pending',
    })

    for (const trade of expiredTrades) {
      const signal = await Signal.findById(trade.signalId)
      if (!signal) continue

      const user = await User.findById(trade.userId)
      if (!user) continue

      let result = 'win'
      let profit = 0
      let lossReason = ''

      if (trade.direction !== signal.direction || trade.duration !== signal.duration) {
        result = 'lose'
        if (trade.direction !== signal.direction && trade.duration !== signal.duration) {
          lossReason = 'Direction and duration mismatch'
        } else if (trade.direction !== signal.direction) {
          lossReason = 'Direction mismatch'
        } else {
          lossReason = 'Duration mismatch'
        }
      } else {
        profit = trade.amount * signal.profitRate
        user.balance += trade.amount + profit
        user.hasTraded = true
        await user.save()
      }

      trade.result = result
      trade.profit = profit
      await trade.save()

      await History.create({
        user: trade.userId,
        type: 'trade',
        amount: profit,
        message:
          result === 'win'
            ? `Trade won on ${trade.coin}, earned ₦${profit}`
            : `Trade lost on ${trade.coin}. Reason: ${lossReason}`,
      })
    }
  })
}
