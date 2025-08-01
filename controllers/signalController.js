// controllers/signalController.js
import Signal from '../models/Signal.js'


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
