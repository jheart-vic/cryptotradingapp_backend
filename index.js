import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import teamRoutes from './routes/teamRoutes.js'
import tradeRoutes from './routes/tradeRoutes.js'
import signalRoutes from './routes/signalRoutes.js'



dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/signal', signalRoutes)



const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
