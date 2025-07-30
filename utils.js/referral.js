import User from '../models/User.js'

export const getReferralTree = async (userId) => {
  const user = await User.findById(userId)
  if (!user) throw new Error('User not found')

  const level1 = await User.find({ invitedBy: user.inviteCode })
  const level2 = await User.find({ invitedBy: { $in: level1.map(u => u.inviteCode) } })
  const level3 = await User.find({ invitedBy: { $in: level2.map(u => u.inviteCode) } })

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


// export const getReferralTree = async (userId) => {
//   const user = await User.findById(userId)
//   if (!user) throw new Error('User not found')

//   const level1 = await User.find({ invitedBy: user.inviteCode })
//   const level2 = await User.find({ invitedBy: { $in: level1.map(u => u.inviteCode) } })
//   const level3 = await User.find({ invitedBy: { $in: level2.map(u => u.inviteCode) } })

//   // 👉 Utility to calculate per-user subteam counts
//   const getUserTeamStats = async (user) => {
//     const directInvites = await User.find({ invitedBy: user.inviteCode })
//     const validCount = directInvites.filter(u => u.hasTraded).length
//     return {
//       totalTeam: directInvites.length,
//       validTeam: validCount
//     }
//   }

//   const formatLevel = async (users) => {
//     const formattedUsers = await Promise.all(users.map(async ({ _id, username, phone, hasTraded, createdAt, inviteCode }) => {
//       const { totalTeam, validTeam } = await getUserTeamStats({ inviteCode })
//       return {
//         _id,
//         username,
//         phone,
//         hasTraded,
//         createdAt,
//         totalTeam,
//         validTeam
//       }
//     }))

//     return {
//       total: formattedUsers.length,
//       valid: formattedUsers.filter(u => u.hasTraded).length,
//       users: formattedUsers
//     }
//   }

//   return {
//     level1: await formatLevel(level1),
//     level2: await formatLevel(level2),
//     level3: await formatLevel(level3)
//   }
// }
