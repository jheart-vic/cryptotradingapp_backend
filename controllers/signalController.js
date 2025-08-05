// controllers/signalController.js
import Signal from '../models/Signal.js'
import { DateTime } from 'luxon'

export const getActiveSignals = async (req, res) => {
  try {
    const now = DateTime.now().setZone('Africa/Lagos').toJSDate();

    const signals = await Signal.aggregate([
      {
        $match: {
          isActive: true,
          startTime: { $lte: now },
          endTime: { $gte: now }
        }
      },
      {
        $sort: {
          coin: 1,
          createdAt: -1
        }
      },
      {
        $group: {
          _id: "$coin",
          signal: { $first: "$$ROOT" }
        }
      },
      {
        $replaceRoot: {
          newRoot: "$signal"
        }
      }
    ]);

    if (!signals.length) {
      return res.status(404).json({ msg: 'No active signals found' });
    }

    res.json(signals);
  } catch (err) {
    console.error('Error fetching active signals:', err);
    res.status(500).json({ msg: 'Failed to get active signals' });
  }
};
