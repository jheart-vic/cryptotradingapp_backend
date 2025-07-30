import User from '../models/User.js'

export const applyReferralBonus = async (userId, amount) => {
  const user = await User.findById(userId)
  if (!user || !user.invitedBy) return

  const level1 = await User.findOne({ inviteCode: user.invitedBy })
  if (level1) {
    level1.balance += amount * 0.05
    await level1.save()
  }

  if (level1?.invitedBy) {
    const level2 = await User.findOne({ inviteCode: level1.invitedBy })
    if (level2) {
      level2.balance += amount * 0.02
      await level2.save()
    }

    if (level2?.invitedBy) {
      const level3 = await User.findOne({ inviteCode: level2.invitedBy })
      if (level3) {
        level3.balance += amount * 0.01
        await level3.save()
      }
    }
  }
}
