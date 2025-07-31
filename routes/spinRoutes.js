import express from 'express'
import { auth, isAdmin } from '../middleware/auth.js'
import { giveSpin, spinWheel } from '../controllers/spinController.js'


const router = express.Router()

router.post('/give-spin',auth, isAdmin, giveSpin)
router.post('/spin',auth, spinWheel)

export default router
