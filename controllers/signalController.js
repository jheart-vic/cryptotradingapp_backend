// controllers/signalController.js
import Signal from '../models/Signal.js'


// export const getActiveSignals = async (req, res) => {
//   try {
//     const signals = await Signal.find({ isActive: true }).sort({
//       startTime: -1
//     })
//     res.json(signals)
//   } catch (err) {
//     res.status(500).json({ msg: err.message })
//   }
// }

export const getActiveSignal = async (req, res) => {
  try {
    const now = DateTime.now().setZone('Africa/Lagos').toJSDate();
    const signal = await Signal.findOne({
      startTime: { $lte: now },
      endTime: { $gte: now },
      isActive: true
    }).sort({ createdAt: -1 });

    if (!signal) {
      return res.status(404).json({ msg: 'No active signal found' });
    }

    res.json(signal);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};