import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { startTradingCrons } from '../cronjob/cronJob.js'
dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
  startTradingCrons();
    console.log('MongoDB connected')
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}

export default connectDB
