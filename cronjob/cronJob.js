import cron from 'node-cron'
import { DateTime } from 'luxon'
import Trade from '../models/Trade.js'
import Signal from '../models/Signal.js'
import User from '../models/User.js'
import { applyReferralBonus } from '../utils/referralBonus.js'


const ZONE = 'Africa/Lagos'

// Runs every 30 seconds
export const startTradingCrons = () => {
cron.schedule('*/30 * * * * *', async () => {
  console.log('⏱️ Evaluating expired signals...')

  const now = DateTime.now().setZone(ZONE).toJSDate()

  const expiredSignals = await Signal.find({
    endTime: { $lt: now },
    isActive: true,
    evaluated: false,
  })

  for (const signal of expiredSignals) {
    signal.isActive = false
    signal.evaluated = true
    await signal.save()

    const trades = await Trade.find({ signalId: signal._id, result: 'pending' })

    for (const trade of trades) {
      let result = 'win'
      let profit = 0

      if (trade.direction !== signal.direction) {
        result = 'lose'
      } else {
        profit = trade.amount * signal.profitRate

        const user = await User.findById(trade.userId)
        if (user) {
          user.balance += trade.amount + profit
          user.hasTraded = true
          await user.save()

          // ✅ Apply referral bonus only on win
          await applyReferralBonus(user._id, trade.amount)
        }
      }

      trade.result = result
      trade.profit = profit
      await trade.save()
    }
  }
})
}
