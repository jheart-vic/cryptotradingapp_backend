// routes/signalRoutes.js
import express from 'express'
import { auth } from '../middleware/auth.js'

import {
  getActiveSignal
} from '../controllers/signalController.js'

const router = express.Router()

router.get('/active', auth, getActiveSignal)

export default router
