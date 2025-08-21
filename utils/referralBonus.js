import User from '../models/User.js'
import History from '../models/History.js'

export const applyReferralBonus = async (userId, amount) => {
  const user = await User.findById(userId)
  if (!user || !user.invitedBy) return

  // -------- LEVEL 1 (Direct Upline) --------
  const level1 = await User.findById(user.invitedBy)
  if (level1) {
    const bonus1 = amount * 0.05
    level1.balance += bonus1
    await level1.save()

    await History.create({
      user: level1._id,
      type: 'bonus',
      amount: bonus1,
      message: `Referral bonus from ${user.username} (Level 1)`
    })
  }

  // -------- LEVEL 2 (Upline’s Upline) --------
  if (level1?.invitedBy) {
    const level2 = await User.findById(level1.invitedBy)
    if (level2) {
      const bonus2 = amount * 0.02
      level2.balance += bonus2
      await level2.save()

      await History.create({
        user: level2._id,
        type: 'bonus',
        amount: bonus2,
        message: `Referral bonus earned from ${user.username} (Level 2)`
      })
    }

    // -------- LEVEL 3 (Upline of Upline’s Upline) --------
    if (level2?.invitedBy) {
      const level3 = await User.findById(level2.invitedBy)
      if (level3) {
        const bonus3 = amount * 0.01
        level3.balance += bonus3
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



// const BONUS_RATES = [0.05, 0.02, 0.01] // configurable

// export const applyReferralBonus = async (userId, amount) => {
//   const user = await User.findById(userId)
//   if (!user || !user.invitedBy) return

//   let currentUplineId = user.invitedBy

//   for (let level = 0; level < BONUS_RATES.length; level++) {
//     if (!currentUplineId) break

//     const upline = await User.findById(currentUplineId)
//     if (!upline) break

//     const rate = BONUS_RATES[level]
//     const bonus = amount * rate

//     // credit bonus
//     upline.balance += bonus
//     await upline.save()

//     // history log
//     await History.create({
//       user: upline._id,
//       type: 'bonus',
//       amount: bonus,
//       message: `Referral bonus earned from ${user.username} (Level ${level + 1})`
//     })

//     // move up the chain
//     currentUplineId = upline.invitedBy
//   }
// }
