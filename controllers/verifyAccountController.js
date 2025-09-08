// controllers/otpayController.js
import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const MERCHANT_ID = process.env.OTPAY_MERCHANT_ID;
const APP_SECRET = process.env.OTPAY_APP_SECRET;
const BASE_URL = process.env.OTPAY_BASE_URL;

function md5(str) {
  return crypto.createHash("md5").update(str, "utf8").digest("hex").toLowerCase();
}

export async function verifyAccount(req, res) {
  try {
    const { accountNumber, bankCode } = req.body;

    if (!accountNumber || !bankCode) {
      return res.status(400).json({ error: "accountNumber and bankCode are required" });
    }

    // 1. Build timestamp
    const timestamp = Date.now();

    // 2. Build sign string
    const signString = `merchantId=${MERCHANT_ID}&appSecret=${APP_SECRET}`;
    const sign = md5(signString);

    // 3. Build request body
    const body = {
      merchantId: MERCHANT_ID,
      accountNumber,
      accountBank: bankCode,
      timestamp,
      sign,
    };

    console.log("Verify Account Body:", body);

    // 4. Send to OTpay
    const otRes = await axios.post(`${BASE_URL}/api/order/naps/transfer/verify`, body);

    return res.json(otRes.data);
  } catch (err) {
    console.error("verifyAccount error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify account", details: err.response?.data || err.message });
  }
}
