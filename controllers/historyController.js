import History from '../models/History.js'

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id
    const count = await History.countDocuments({ user: userId, isRead: false })
    res.json({ unreadCount: count })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const getAllReadNotifications = async (req, res) => {
  try {
    const userId = req.user._id
    const notifications = await History.find({
      user: userId,
      isRead: true
    }).sort({ createdAt: -1 })
    res.json({ notifications })
  } catch (error) {
    res.status(500).json({ msg: error.message })
  }
}

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id
    await History.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    )
    res.json({ msg: 'All notifications marked as read' })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const markOneAsRead = async (req, res) => {
  try {
    const userId = req.user._id
    const { id } = req.params

    const history = await History.findOne({ _id: id, user: userId })
    if (!history) return res.status(404).json({ msg: 'Notification not found' })

    history.isRead = true
    await history.save()

    res.json({ msg: 'Notification marked as read' })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const getUserHistory = async (req, res) => {
  try {
    const userId = req.user._id
    const { type } = req.query // optional: ?type=deposit or ?type=all

    const query = { user: userId }
    if (type && type !== 'all') query.type = type

    const history = await History.find(query).sort({ createdAt: -1 })
    res.json({ history })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
