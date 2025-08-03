// controllers/cronController.js
import { evaluateSignals } from '../cronjob/evaluateSignals.js'

export const evaluateSignalsHandler = async (req, res) => {
  const token = req.headers['x-cron-secret']
  if (token !== process.env.CRON_SECRET) {
    return res.status(403).json({ message: 'Unauthorized' })
  }

  try {
    await evaluateSignals()
    res.status(200).json({ message: 'Signal evaluation completed' })
  } catch (err) {
    res.status(500).json({ message: 'Error running evaluation', error: err.message })
  }
}
