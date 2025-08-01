import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import teamRoutes from './routes/teamRoutes.js'
import tradeRoutes from './routes/tradeRoutes.js'
import signalRoutes from './routes/signalRoutes.js'
import userRoutes from './routes/userRoutes.js'
import spinRoutes from './routes/spinRoutes.js'
import  adminRoutes from './routes/adminRoutes.js'
import  historyRoutes from './routes/historyRoutes.js'



dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/team', teamRoutes)
app.use('/api/trade', tradeRoutes)
app.use('/api/signal', signalRoutes)
app.use('/api/user', userRoutes)
app.use('/api/spin', spinRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/history', historyRoutes)




const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
app.get('/', (req, res) => {
  res.send('KubraX Backend is running')
})
app.get('/api/ping', (req, res) => {
  res.status(200).send('pong');
});
