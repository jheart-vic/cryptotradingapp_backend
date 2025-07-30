// controllers/signalController.js
import Signal from '../models/Signal.js'
import { DateTime } from 'luxon'

export const createSignal = async (req, res) => {
  try {
    const { coin, direction, duration, profitRate } = req.body

    if (!coin || !direction || !duration || !profitRate) {
      return res.status(400).json({ msg: 'All fields are required' })
    }

    const startTime = DateTime.now().setZone('Africa/Lagos')
    const endTime = startTime.plus({ seconds: duration })

    const start = startTime.toJSDate()
    const end = endTime.toJSDate()

    const signal = await Signal.create({
      coin,
      direction,
      duration,
      profitRate,
      start,
      end,
      createdBy: req.user._id
    })

    res.json({ msg: 'Signal created', signal })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}


export const getActiveSignals = async (req, res) => {
  try {
    const signals = await Signal.find({ isActive: true }).sort({
      startTime: -1
    })
    res.json(signals)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
