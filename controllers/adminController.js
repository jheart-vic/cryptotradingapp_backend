import Signal from "../models/Signal"

export const getSignalHistory = async (req, res) => {
  try {
    const signals = await Signal.find().sort({ startTime: -1 })
    res.json(signals)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
