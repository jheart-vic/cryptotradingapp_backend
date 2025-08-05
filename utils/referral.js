import User from '../models/User.js'

export const getReferralTree = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  const level1 = await User.find({ invitedBy: user._id });
  const level2 = await User.find({ invitedBy: { $in: level1.map(u => u._id) } });
  const level3 = await User.find({ invitedBy: { $in: level2.map(u => u._id) } });

  const formatLevel = (users) => ({
    total: users.length,
    valid: users.filter(u => u.hasTraded).length,
    users: users.map(({ _id, username, phone, hasTraded, createdAt }) => ({
      _id, username, phone, hasTraded, createdAt
    }))
  })

  return {
    level1: formatLevel(level1),
    level2: formatLevel(level2),
    level3: formatLevel(level3)
  }
}