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
function generateSign(params = {}, type = "order") {
  let str;

  switch (type) {
    case "order": // deposit / callback
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${APP_SECRET}`;
      break;

    case "payout": // withdrawals
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${APP_SECRET}`;
      break;

    case "query":
    case "payoutResult":
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&appSecret=${APP_SECRET}`;
      break;

    case "balance":
      str = `merchantId=${MERCHANT_ID}&timestamp=${params.timestamp}&appSecret=${APP_SECRET}`;
      break;

    case "bankList": // ✅ strictly merchantId + appSecret
      str = `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`;
      break;

    default:
      str = `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`;
  }

  console.log("Sign String Used:", str);
  return md5(str);
}

// ----- GET BANK CODE -----
async function getBankCode(bankName) {
  const body = {
    merchantId: MERCHANT_ID,
    sign: generateSign({}, "bankList"), // ✅ no keyword in sign
  };

  if (bankName) {
    body.keyword = bankName; // ✅ keyword only in body
  }

  console.log("BankList Request Body:", body);

  const res = await axios.post(`${BASE_URL}/api/payout/bankList`, body);

  if (res.data.code !== 0) {
    console.error("BankList Response Error:", res.data);
    throw new Error(res.data.msg || res.data.error || "Failed to fetch bank list");
  }

  const bank = res.data.data.find(
    (b) => b?.bankName?.toLowerCase() === bankName.toLowerCase()
  );
  if (!bank) throw new Error(`Bank '${bankName}' not found in OTpay list`);

  return bank.bankCode;
}


// ----- CREATE WITHDRAWAL -----
async function createWithdrawalOrder({
  merchantOrderId,
  amount,
  bankName,
  accountNumber,
  accountName,
  extra = {},
}) {
  const amountStr = parseFloat(amount).toFixed(2);

  // 1. Fetch bankCode first
  const bankCode = await getBankCode(bankName);

  // 2. Generate correct payout sign
  const sign = generateSign({ merchantOrderId, amount: amountStr }, "payout");

  // 3. Build request body
  const body = {
    merchantId: MERCHANT_ID,
    merchantOrderId,
    amount: amountStr, // ✅ must be amount
    bankCode,
    accountName,
    accountNumber,
    notifyUrl: process.env.OTPAY_NOTIFY_URL,
    sign,
    fundAccount: {
      accountType: "bank_account",
      contact: {
        name: accountName,
        email: extra?.email || "test@example.com",
        mobile: extra?.mobile || "08000000000",
        address: extra?.address || "",
      },
      bankAccount: {
        name: accountName,
        bankCode,
        accountNumber,
        extra,
      },
    },
  };

  console.log("Withdrawal Body Sent:", body);

  const res = await axios.post(`${BASE_URL}/api/payout/submit`, body);
  return res.data;
}

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
