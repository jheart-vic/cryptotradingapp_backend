// scripts/updateSignalsWithCoingeckoId.js

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Signal from './models/Signal.js'


dotenv.config()

const coinIdMap = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  BNB: 'binancecoin',
  USDT: 'tether',
  XRP: 'ripple',
  SOL: 'solana',
  ADA: 'cardano',
  DOGE: 'dogecoin',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  SHIB: 'shiba-inu',
  LTC: 'litecoin',
  TRX: 'tron',
  AVAX: 'avalanche-2',
  CRO: 'cronos',
  LINK: 'chainlink',
  BCH: 'bitcoin-cash',
  XLM: 'stellar',
  ETC: 'ethereum-classic',
  FIL: 'filecoin',
  EOS: 'eos',
  APE: 'apecoin',
  ATOM: 'cosmos',
  NEAR: 'near',
  MANA: 'decentraland',
  SUSHI: 'sushi',
  AAVE: 'aave',
  ICP: 'internet-computer',
  LUNC: 'terra-luna-2',
  TON: 'toncoin',
  FTM: 'fantom',
  VET: 'vechain',
  HBAR: 'hedera-hashgraph',
  XMR: 'monero',
  QNT: 'quant-network',
  AR: 'arweave',
  AXS: 'axie-infinity',
  GRT: 'the-graph',
  THETA: 'theta-token',
  GMT: 'stepn',
}

async function updateSignals() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to DB')

    const signals = await Signal.find({ coingeckoId: { $exists: false } })

    console.log(`🔍 Found ${signals.length} signal(s) missing coingeckoId`)

    for (const signal of signals) {
      const baseSymbol = signal.coin.split('/')[0].toUpperCase()
      const coingeckoId = coinIdMap[baseSymbol]

      if (coingeckoId) {
        signal.coingeckoId = coingeckoId
        await signal.save()
        console.log(`✅ Updated signal ${signal._id} with ${coingeckoId}`)
      } else {
        console.warn(`⚠️ No mapping found for ${baseSymbol} in signal ${signal._id}`)
      }
    }

    console.log('✅ All done')
    process.exit()
  } catch (err) {
    console.error('❌ Error updating signals:', err)
    process.exit(1)
  }
}

updateSignals()
