import express from 'express'
import {auth} from '../middleware/auth.js'
import { placeTrade } from '../controllers/tradeController.js'

const router = express.Router()

router.post('/place', auth, placeTrade)

export default router
