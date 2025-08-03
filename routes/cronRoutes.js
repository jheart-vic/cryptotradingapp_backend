// routes/cronRoutes.js
import express from 'express'
import { evaluateSignalsHandler } from '../controllers/cronJobHttpHandler.js'

const router = express.Router()

router.post('/evaluate-signals', evaluateSignalsHandler)

export default router
