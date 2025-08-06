import Transaction from '../models/Transaction.js'
import User from '../models/User.js'
import Settings from '../models/Settings.js';

export const requestDeposit = async (req, res) => {
  const { amount, method, walletAddress, bankName, accountNumber } = req.body
  try {
    const settings = await Settings.findOne()
    if (settings && settings.depositEnabled === false) {
      return res.status(403).json({ msg: 'Deposits are currently disabled' })
    }

    const tx = await Transaction.create({
      userId: req.user._id,
      type: 'deposit',
      amount,
      method,
      walletAddress,
      bankName,
      accountNumber,
      status: 'pending'
    })
    res.json({ msg: 'Deposit request submitted', tx })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const requestWithdraw = async (req, res) => {
  const { amount, method, walletAddress, bankName, accountNumber } = req.body
  try {
    const settings = await Settings.findOne()
    if (settings && settings.withdrawalEnabled === false) {
      return res.status(403).json({ msg: 'Withdrawals are currently disabled' })
    }

    const user = await User.findById(req.user._id)
    if (user.balance < amount) {
      return res.status(400).json({ msg: 'Insufficient balance' })
    }

    const tx = await Transaction.create({
      userId: user._id,
      type: 'withdraw',
      amount,
      method,
      walletAddress,
      bankName,
      accountNumber,
      status: 'pending'
    })

    res.json({ msg: 'Withdraw request submitted', tx })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}

export const updateTransactionStatus = async (req, res) => {
  const { id, action } = req.params // action = approve/reject
  try {
    const tx = await Transaction.findById(id)
    if (!tx || tx.status !== 'pending') {
      return res.status(400).json({ msg: 'Invalid or already handled transaction' })
    }

    const user = await User.findById(tx.userId)
    if (!user) return res.status(404).json({ msg: 'User not found' })

    if (action === 'approve') {
      tx.status = 'approved'
      tx.approvedAt = new Date()

      if (tx.type === 'deposit') {
        user.balance += tx.amount
        user.totalDeposit += tx.amount
      } else if (tx.type === 'withdraw') {
        user.balance -= tx.amount
        user.totalWithdraw += tx.amount
      }

      await user.save()
    } else {
      tx.status = 'rejected'
    }

    await tx.save()
    res.json({ msg: `Transaction ${action}d`, tx })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
}
