import express from 'express'
import {
  addUserBonus,
  getSignalHistory,
  createSignal,
  getSwitches,
  toggleSwitch,
  getAllWithdrawals,
  getAllDeposits,
  getAllTrades,
  impersonateUser,
  toggleUserHold,
  deleteUser,
  getAllUsers,
  getAdminDashboardStats
} from '../controllers/adminController.js'

const router = express.Router()

// 📊 Admin dashboard stats
router.get('/dashboard-stats', getAdminDashboardStats)

// 👥 Users
router.get('/users', getAllUsers)
router.delete('/users/:id', deleteUser)
router.put('/users/:id/toggle-hold', toggleUserHold)
router.post('/users/:id/impersonate', impersonateUser)
router.post('/users/:id/bonus', addUserBonus) // ✅ Give bonus to user

// 💹 Trades
router.get('/trades', getAllTrades)

// 💸 Deposits
router.get('/deposits', getAllDeposits)

// 🏦 Withdrawals
router.get('/withdrawals', getAllWithdrawals)

// 📶 Signals
router.post('/signals', createSignal)
router.get('/signals/history', getSignalHistory)

// ⚙️ Feature switches
router.get('/switches', getSwitches)
router.put('/switches/:key/toggle', toggleSwitch)

export default router
