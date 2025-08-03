import express from 'express'
import {auth} from '../middleware/auth.js'
import { getUserTrades, placeTrade } from '../controllers/tradeController.js'

const router = express.Router()

router.post('/place', auth, placeTrade)
router.get('/my-trades', auth, getUserTrades)

export default router
