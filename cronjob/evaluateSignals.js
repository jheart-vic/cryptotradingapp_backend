// jobs/evaluateSignals.js
import Signal from '../models/Signal.js'
import { DateTime } from 'luxon'

export const evaluateSignals = async () => {
  try {
    // Get the current time in UTC using Luxon
    const now = DateTime.utc().toJSDate()

    const expiredSignals = await Signal.find({
      isActive: true,
      endTime: { $lte: now }
    })

    for (const signal of expiredSignals) {
      signal.isActive = false
      signal.evaluated = true
      await signal.save()
    }

    if (expiredSignals.length > 0) {
      console.log(`✅ Evaluated ${expiredSignals.length} expired signals`)
    }
  } catch (error) {
    console.error('❌ Error evaluating signals:', error.message)
  }
}
