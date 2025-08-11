// helpers/otpay.js
import crypto from "crypto";
import axios from "axios";

const merchantId = process.env.OTPAY_MERCHANT_ID || "999";
const appSecret = process.env.OTPAY_APP_SECRET || "bHtSd4DkZSdonKLvtest";
const baseUrl = "https://pay.otpay.io";

function generateSign(params, type = "order") {
  let str = "";
  if (type === "order" || type === "callback") {
    str = `merchantId=${params.merchantId}&merchantOrderId=${params.merchantOrderId}&amount=${params.amount}&appSecret=${appSecret}`;
  } else if (type === "query" || type === "payoutResult") {
    str = `merchantId=${params.merchantId}&merchantOrderId=${params.merchantOrderId}&appSecret=${appSecret}`;
  } else if (type === "balance") {
    str = `merchantId=${params.merchantId}&timestamp=${params.timestamp}&appSecret=${appSecret}`;
  } else {
    str = `merchantId=${params.merchantId}&appSecret=${appSecret}`;
  }
  return crypto.createHash("md5").update(str).digest("hex");
}

async function createDepositOrder(txId, amount) {
  const params = {
    merchantId,
    merchantOrderId: txId,
    amount: amount,
    notifyUrl: `${process.env.BASE_URL}/otpay/webhook`,
  };
  params.sign = generateSign(params, "order");
  return axios.post(`${baseUrl}/api/order/submit`, params);
}

async function createWithdrawalOrder(txId, amount, bankName, bankAccount) {
  const params = {
    merchantId,
    merchantOrderId: txId,
    amount: amount,
    bankName,
    bankAccount,
    notifyUrl: `${process.env.BASE_URL}/otpay/webhook`,
  };
  params.sign = generateSign(params, "order");
  return axios.post(`${baseUrl}/api/payout/submit`, params);
}

export default { generateSign, createDepositOrder, createWithdrawalOrder };
