import axios from "axios";
import dotenv from 'dotenv'
import md5 from "md5";
dotenv.config()

const MERCHANT_ID = process.env.OTPAY_MERCHANT_ID;
const APP_SECRET = process.env.OTPAY_APP_SECRET;
const BASE_URL = process.env.OTPAY_BASE_URL;

let bankListCache = null;
let bankListCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function getBankList(req, res) {
  try {
    const now = Date.now();

    if (bankListCache && (now - bankListCacheTime < CACHE_TTL)) {
      return res.json({ code: 0, data: bankListCache });
    }

    const body = {
      merchantId: MERCHANT_ID,
      sign: md5(`merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`).toUpperCase()
    };

    const otpayRes = await axios.post(`${BASE_URL}/api/payout/bankList`, body);

    if (otpayRes.data.code !== 0) {
      return res.status(400).json({ error: otpayRes.data.error || "Failed to fetch bank list" });
    }

    bankListCache = otpayRes.data.data || [];
    bankListCacheTime = now;

    res.json({ code: 0, data: bankListCache });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
