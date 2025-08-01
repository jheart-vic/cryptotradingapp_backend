// routes/signalRoutes.js
import express from 'express'
import { auth } from '../middleware/auth.js'

import {
  getActiveSignals
} from '../controllers/signalController.js'

const router = express.Router()

router.get('/active', auth, getActiveSignals)

export default router
