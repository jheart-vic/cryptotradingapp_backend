// routes/signalRoutes.js
import express from 'express'
import { auth, isAdmin } from '../middleware/auth.js'

import {
  createSignal,
  getActiveSignals
} from '../controllers/signalController.js'

const router = express.Router()

router.post('/create', auth, isAdmin, createSignal)
router.get('/active', auth, getActiveSignals)

export default router
