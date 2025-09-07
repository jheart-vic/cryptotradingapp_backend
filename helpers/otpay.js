// helpers/otpay.js
import crypto from 'crypto'
import axios from 'axios'

const MERCHANT_ID = process.env.OTPAY_MERCHANT_ID || '999'
const APP_SECRET = process.env.OTPAY_APP_SECRET || 'bHtSd4DkZSdonKLvtest'
const BASE_URL = (process.env.OTPAY_BASE_URL || 'https://xxx').replace(
  /\/+$/,
  ''
)

function md5 (str) {
  return crypto
    .createHash('md5')
    .update(String(str), 'utf8')
    .digest('hex')
    .toLowerCase()
}

// ----- SIGN GENERATION -----
function generateSign (params = {}, type = 'order') {
  let str

  switch (type) {
    case 'order': // deposit
    case 'callback':
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${APP_SECRET}`
      break

    case 'payout': // withdrawals
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${APP_SECRET}`
      break

    case 'query':
    case 'payoutResult':
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&appSecret=${APP_SECRET}`
      break

    case 'balance':
      str = `merchantId=${MERCHANT_ID}&timestamp=${params.timestamp}&appSecret=${APP_SECRET}`
      break

    case 'bankList': // 👈 NEW case for banks
      str = params.keyword
        ? `merchantId=${MERCHANT_ID}&keyword=${params.keyword}&appSecret=${APP_SECRET}`
        : `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`
   console.log("BankList Sign String:", str);

      break

    default:
      str = `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`
  }

  return md5(str).toUpperCase() // OTpay expects uppercase
}

// ----- BANK LIST CACHE -----
let bankListCache = null
let bankListCacheTime = 0
const CACHE_TTL = 1000 * 60 * 60 // 1 hour cache

// ----- GET BANK CODE -----
async function getBankCode (bankName) {
  const now = Date.now()

  // Use cache if still valid
  if (bankListCache && now - bankListCacheTime < CACHE_TTL) {
    const bank = bankListCache.find(
      b => b?.bankName?.toLowerCase() === bankName?.toLowerCase()
    )
    if (!bank)
      throw new Error(`Bank '${bankName}' not found in cached OTpay list`)
    return bank.bankCode
  }

  // Otherwise, fetch from OTpay
  const body = {
    merchantId: MERCHANT_ID,
    sign: generateSign({}, 'bankList')
  }
console.log("BankList Sign:", generateSign({}, "bankList"));

  const res = await axios.post(`${BASE_URL}/api/payout/bankList`, body)

  if (res.data.code !== 0) {
    throw new Error(res.data.error || 'Failed to fetch bank list')
  }

  // Cache the list
  bankListCache = res.data.data || []
  bankListCacheTime = now

  // Lookup the bank
  const bank = bankListCache.find(
    b => b?.bankName?.toLowerCase() === bankName?.toLowerCase()
  )
  if (!bank) throw new Error(`Bank '${bankName}' not found in OTpay list`)
  return bank.bankCode
}

// ----- GET BANK CODE (without cache) -----
// async function getBankCode(bankName) {
//   const body = {
//     merchantId: MERCHANT_ID,
//   };

//   if (bankName) {
//     body.keyword = bankName;
//   }

//   // Always generate sign centrally
//   body.sign = generateSign(body, 'bankList');

//   const res = await axios.post(`${BASE_URL}/api/payout/bankList`, body);

//   if (res.data.code !== 0) {
//     throw new Error(res.data.error || 'Failed to fetch bank list');
//   }

//   const banks = res.data.data || [];
//   const bank = banks.find(
//     b => b?.bankName?.toLowerCase() === bankName?.toLowerCase()
//   );

//   if (!bank) throw new Error(`Bank '${bankName}' not found in OTpay list`);
//   return bank.bankCode;
// }

// ----- CREATE DEPOSIT -----
async function createDepositOrder ({ merchantOrderId, amount, payload = {} }) {
  const amountStr = parseFloat(amount).toFixed(2)
  const sign = generateSign({ merchantOrderId, amount: amountStr }, 'order')
  const body = {
    merchantId: MERCHANT_ID,
    merchantOrderId,
    amount: amountStr,
    notifyUrl: process.env.OTPAY_NOTIFY_URL,
    callbackUrl:
      process.env.OTPAY_CALLBACK_URL ||
      'https://cryptotradingapp.vercel.app/deposit-success',
    payType: payload.payType || 1,
    sign,
    ...payload
  }
  const res = await axios.post(`${BASE_URL}/api/order/submit`, body)
  return res.data
}

// ----- CREATE WITHDRAWAL -----
async function createWithdrawalOrder ({
  merchantOrderId,
  amount,
  bankName,
  accountNumber,
  accountName,
  extra = {}
}) {
  const amountStr = parseFloat(amount).toFixed(2)
  const sign = generateSign({ merchantOrderId, amount: amountStr }, 'payout')

  // fetch bankCode
  const bankCode = await getBankCode(bankName)

  const body = {
    merchantId: MERCHANT_ID,
    merchantOrderId,
    amount: amountStr,
    notifyUrl: process.env.OTPAY_NOTIFY_URL,
    sign,
    fundAccount: {
      accountType: 'bank_account',
      contact: {
        name: accountName,
        email: extra?.email || 'test@example.com',
        mobile: extra?.mobile || '08000000000',
        address: extra?.address || ''
      },
      bankAccount: {
        name: accountName,
        bankCode,
        accountNumber,
        extra
      }
    }
  }

  const res = await axios.post(`${BASE_URL}/api/payout/submit`, body)
  return res.data
}

// ----- QUERY -----
async function queryOrderStatus (merchantOrderId) {
  const sign = generateSign({ merchantOrderId }, 'query')
  const url = `${BASE_URL}/api/order/status?merchantId=${MERCHANT_ID}&merchantOrderId=${merchantOrderId}&sign=${sign}`
  const res = await axios.get(url)
  return res.data
}

async function queryPayout (merchantOrderId) {
  const sign = generateSign({ merchantOrderId }, 'payoutResult')
  const body = { merchantId: MERCHANT_ID, merchantOrderId, sign }
  const res = await axios.post(`${BASE_URL}/api/payout/query`, body)
  return res.data
}

async function balanceQuery () {
  const timestamp = Date.now()
  const sign = generateSign({ timestamp }, 'balance')
  const body = { merchantId: MERCHANT_ID, timestamp, sign }
  const res = await axios.post(`${BASE_URL}/api/payout/balance/query`, body)
  return res.data
}

function verifyDepositCallback (body) {
  const signString = `merchantId=${MERCHANT_ID}&merchantOrderId=${body.merchantOrderId}&amount=${body.payAmount}&appSecret=${APP_SECRET}`
  const expected = md5(signString)
  console.log('signString:', signString)
  console.log('expected:', expected)
  console.log('received:', body.sign)
  return expected === String(body.sign).toLowerCase()
}

function verifyWithdrawalCallback (body) {
  const expected = generateSign(
    { merchantOrderId: body.merchantOrderId },
    'payoutResult'
  )
  return expected === String(body.sign).toLowerCase()
}

export default {
  generateSign,
  createDepositOrder,
  createWithdrawalOrder,
  queryOrderStatus,
  queryPayout,
  balanceQuery,
  verifyDepositCallback,
  verifyWithdrawalCallback,
  getBankCode
}
