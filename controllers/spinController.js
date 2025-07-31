import History from '../models/History.js'
import User from '../models/User.js'
const allPrizes = [
  { label: '$0.5', value: 0.5 },
  { label: '$1.0', value: 1.0 },
  { label: '$1.5', value: 1.5 },
  { label: '$2.0', value: 2.0 },
  { label: '$5.0', value: 5.0 },
  { label: '$10', value: 10 },
  { label: '$20', value: 20 },
  { label: '$50', value: 50 },
  { label: '$99', value: 99 }
]

// But we define which prizes the user can actually win:
const winRange = [0.5, 1.0, 1.5, 2.0]


// Admin gives a spin to a user
export const giveSpin = async (req, res) => {
  const { phone, spins = 1 } = req.body

  const user = await User.findOne({ phone })
  if (!user) return res.status(404).json({ message: 'User not found' })

  user.spins += spins
  await user.save()
 await History.create({
    user: user._id,
    type: 'spin-reward',
    message: `You won 1 spin wheel from admin`,
  })
  res.json({ message: `${spins} spin(s) given to ${user.username}`, currentSpins: user.spins })
}


// 🟢 Give spin to upline when downline invests
// 🟢 Give spin to upline when downline invests
export const giveSpinToUpline = async (downlineUserId) => {
  const downline = await User.findById(downlineUserId);
  if (!downline || !downline.invitedBy) return;

  const upline = await User.findOne({ inviteCode: downline.invitedBy });
  if (!upline) return;

  upline.spins = (upline.spins || 0) + 1;
  await upline.save();

  // 🔔 Create spin reward history
  await History.create({
    user: upline._id,
    type: 'spin-reward',
    message: `You won 1 chance to spin the wheel due to your downline ${downline.username}'s investment.`,
  });
};


// User spins and receives reward (between $0.5 and $2.0 only)
export const spinWheel = async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user.spins || user.spins <= 0) {
    return res.status(400).json({ message: 'No spins available' })
  }

  // Filter only the prizes that are in the win range
  const allowedPrizes = allPrizes.filter(p => winRange.includes(p.value))

  // Pick one randomly from the allowed
  const reward = allowedPrizes[Math.floor(Math.random() * allowedPrizes.length)]

  user.balance += reward.value
  user.spins -= 1
  await user.save()

  // 🔔 log spin reward history
  await History.create({
    user: user._id,
    type: 'spin-reward',
    amount: reward.value,
    message: `You won ${reward.label} from the spin wheel`
  })

  res.json({
    message: `You won ${reward.label}`,
    reward,
    prizeList: allPrizes,
    newBalance: user.balance,
    remainingSpins: user.spins
  })
}
