import User from '../models/User.js'

export const applyReferralBonus = async (userId, amount) => {
  const user = await User.findById(userId)
  if (!user || !user.invitedBy) return

  const level1 = await User.findOne({ inviteCode: user.invitedBy })
  if (level1) {
    level1.balance += amount * 0.05
    await level1.save()
    await History.create({
      user: level1._id,
      type: 'bonus',
      amount: bonus1,
      message: `Referral bonus from ${user.username} (Level 1)`
    })
  }

  if (level1?.invitedBy) {
    const level2 = await User.findOne({ inviteCode: level1.invitedBy })
    if (level2) {
      level2.balance += amount * 0.02
      await level2.save()
      await History.create({
        user: level2._id,
        type: 'bonus',
        amount: bonus2,
        message: `Referral bonus earned from ${user.username} (Level 2)`
      })
    }

    if (level2?.invitedBy) {
      const level3 = await User.findOne({ inviteCode: level2.invitedBy })
      if (level3) {
        level3.balance += amount * 0.01
        await level3.save()
        await History.create({
          user: level3._id,
          type: 'bonus',
          amount: bonus3,
          message: `Referral bonus earned from ${user.username} (Level 3)`
        })
      }
    }
  }
}
