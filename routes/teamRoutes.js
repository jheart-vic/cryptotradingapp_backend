import express from 'express'
import {auth} from '../middleware/auth.js'
import { getMyTeam } from '../controllers/teamController.js'

const router = express.Router()
router.get('/my-team', auth, getMyTeam)

export default router
