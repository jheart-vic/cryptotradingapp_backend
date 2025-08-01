import express from 'express'
import { auth } from '../middleware/auth.js'
import {  spinWheel } from '../controllers/spinController.js'

const router = express.Router()

router.post('/spin',auth, spinWheel)

export default router
