// helpers/otpay.js
import crypto from 'crypto'
import axios from 'axios'

const MERCHANT_ID = process.env.OTPAY_MERCHANT_ID || '999'
const APP_SECRET = process.env.OTPAY_APP_SECRET || 'bHtSd4DkZSdonKLvtest'
const BASE_URL = (process.env.OTPAY_BASE_URL || 'https://xxx').replace(/\/+$/, '')

function md5(str) {
  return crypto.createHash('md5').update(String(str), 'utf8').digest('hex').toLowerCase()
}


// ----- SIGN GENERATION -----
function generateSign(params = {}, type = 'order') {
  let str;

  switch (type) {
    case 'order':
    case 'callback':
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${APP_SECRET}`;
      break;

    case 'query':
    case 'payoutResult':
      str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&appSecret=${APP_SECRET}`;
      break;

    case 'balance':
      str = `merchantId=${MERCHANT_ID}&timestamp=${params.timestamp}&appSecret=${APP_SECRET}`;
      break;

    case 'bankList':
      str = params.keyword
        ? `merchantId=${MERCHANT_ID}&keyword=${params.keyword}&appSecret=${APP_SECRET}`
        : `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`;
      break;

    default:
      str = `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`;
  }

  return md5(str);
}

// function generateSign(params = {}, type = 'order') {
//   let str = ''
//   if (type === 'order' || type === 'callback') {
//     str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${APP_SECRET}`
//   } else if (type === 'query' || type === 'payoutResult') {
//     str = `merchantId=${MERCHANT_ID}&merchantOrderId=${params.merchantOrderId}&appSecret=${APP_SECRET}`
//   } else if (type === 'balance') {
//     str = `merchantId=${MERCHANT_ID}&timestamp=${params.timestamp}&appSecret=${APP_SECRET}`
//   } else {
//     str = `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`
//   }
//   return md5(str)
// }

// ----- GET BANK CODE -----
async function getBankCode(bankName) {
  const body = {
    merchantId: MERCHANT_ID,
    keyword: bankName || ''
  };
  body.sign = generateSign({ keyword: bankName }, 'bankList');

  const res = await axios.post(`${BASE_URL}/api/payout/bankList`, body);

  if (res.data.code !== 0) {
    throw new Error(res.data.error || 'Failed to fetch bank list');
  }

  const banks = res.data.data || [];
  const bank = banks.find(b =>
    b?.bankName?.toLowerCase() === bankName?.toLowerCase()
  );

  if (!bank) throw new Error(`Bank '${bankName}' not found in OTpay list`);
  return bank.bankCode;
}

// async function getBankCode(bankName) {
//   const body = {
//     merchantId: MERCHANT_ID,
//     keyword: bankName
//   };
//   body.sign = generateSign({}, 'bankList');

//   const res = await axios.post(`${BASE_URL}/api/payout/bankList`, body);

//   console.log("bankList response:", JSON.stringify(res.data, null, 2));

//   if (res.data.code !== 0) {
//     throw new Error(res.data.error || 'Failed to fetch bank list');
//   }

//   const banks = res.data.data || [];
//   const bank = banks.find(b =>
//     b?.bankName && bankName &&
//     b.bankName.toLowerCase().includes(bankName.toLowerCase())
//   );

//   if (!bank) throw new Error(`Bank '${bankName}' not found in OTpay list`);
//   return bank.bankCode;
// }



// ----- CREATE DEPOSIT -----
async function createDepositOrder({ merchantOrderId, amount, payload = {} }) {
  const amountStr = parseFloat(amount).toFixed(2)
  const sign = generateSign({ merchantOrderId, amount: amountStr }, 'order')
  const body = {
    merchantId: MERCHANT_ID,
    merchantOrderId,
    amount: amountStr,
    notifyUrl: process.env.OTPAY_NOTIFY_URL,
    callbackUrl: process.env.OTPAY_CALLBACK_URL || "https://cryptotradingapp.vercel.app/deposit-success",
    payType: payload.payType || 1,
    sign,
    ...payload
  }
  const res = await axios.post(`${BASE_URL}/api/order/submit`, body)
  return res.data
}

// ----- CREATE WITHDRAWAL -----
// helpers/otpay.js
async function createWithdrawalOrder({ merchantOrderId, amount, bankName, accountNumber, accountName, extra = {} }) {
  const amountStr = parseFloat(amount).toFixed(2);
  const sign = generateSign({ merchantOrderId, amount: amountStr }, 'order');

  // fetch bankCode
  const bankCode = await getBankCode(bankName);

  const body = {
    merchantId: MERCHANT_ID,
    merchantOrderId,
    amount: amountStr,
    notifyUrl: process.env.OTPAY_NOTIFY_URL,
    sign,
    fundAccount: {
      accountType: "bank_account",
      contact: {
        name: accountName,
        email: extra?.email || "test@example.com",
        mobile: extra?.mobile || "08000000000",
        address: extra?.address || ""
      },
      bankAccount: {
        name: accountName,
        bankCode,
        accountNumber,
        extra
      }
    }
  };

  const res = await axios.post(`${BASE_URL}/api/payout/submit`, body);
  return res.data;
}


// ----- QUERY -----
async function queryOrderStatus(merchantOrderId) {
  const sign = generateSign({ merchantOrderId }, 'query')
  const url = `${BASE_URL}/api/order/status?merchantId=${MERCHANT_ID}&merchantOrderId=${merchantOrderId}&sign=${sign}`
  const res = await axios.get(url)
  return res.data
}

async function queryPayout(merchantOrderId) {
  const sign = generateSign({ merchantOrderId }, 'payoutResult')
  const body = { merchantId: MERCHANT_ID, merchantOrderId, sign }
  const res = await axios.post(`${BASE_URL}/api/payout/query`, body)
  return res.data
}

async function balanceQuery() {
  const timestamp = Date.now()
  const sign = generateSign({ timestamp }, 'balance')
  const body = { merchantId: MERCHANT_ID, timestamp, sign }
  const res = await axios.post(`${BASE_URL}/api/payout/balance/query`, body)
  return res.data
}

function verifyDepositCallback(body) {
  const signString = `merchantId=${MERCHANT_ID}&merchantOrderId=${body.merchantOrderId}&amount=${body.payAmount}&appSecret=${APP_SECRET}`;
  const expected = md5(signString);
console.log("signString:", signString);
console.log("expected:", expected);
console.log("received:", body.sign);
  return expected === String(body.sign).toLowerCase();
}


function verifyWithdrawalCallback(body) {
  const expected = generateSign({ merchantOrderId: body.merchantOrderId }, 'payoutResult')
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
