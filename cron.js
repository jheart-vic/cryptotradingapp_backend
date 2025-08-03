// cron.js
import cron from 'node-cron'
import { evaluateSignals } from './cronjob/evaluateSignals.js'

if (process.env.NODE_ENV !== 'production') {
  cron.schedule('* * * * *', () => {
    console.log('⏰ [Dev Mode] Running scheduled signal evaluation...')
    evaluateSignals()
  })
}
