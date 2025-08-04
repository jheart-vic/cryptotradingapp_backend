// controllers/signalController.js
import Signal from '../models/Signal.js'
import { DateTime } from 'luxon'

export const getActiveSignals = async (req, res) => {
  try {
    const now = DateTime.now().setZone('Africa/Lagos').toJSDate();

    // Get all active signals that are currently within the valid time
    const signals = await Signal.find({
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true
    }).sort({ createdAt: -1 });

    // Group by coin: keep only the latest signal per coin
    const uniqueSignalsMap = {};
    for (const sig of signals) {
      if (!uniqueSignalsMap[sig.coin]) {
        uniqueSignalsMap[sig.coin] = sig;
      }
    }

    const result = Object.values(uniqueSignalsMap);

    if (!result.length) {
      return res.status(404).json({ msg: 'No active signals found' });
    }

    res.json(result);
  } catch (err) {
    console.error('Error fetching active signals:', err);
    res.status(500).json({ msg: 'Failed to get active signals' });
  }
};
