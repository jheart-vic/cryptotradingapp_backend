// routes/otpayWebhook.js
import express from "express";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import OTpay from "../helpers/otpay.js";

const router = express.Router();

router.post("/webhook", async (req, res) => {
  try {
    const { merchantOrderId, amount, status, sign } = req.body;

    // ✅ Validate OTpay signature (exact amount as sent by OTpay)
    const validSign = OTpay.generateSign(
      {
        merchantId: process.env.OTPAY_MERCHANT_ID || "999",
        merchantOrderId,
        amount // DO NOT format — must be identical to OTpay's sent value
      },
      "callback"
    );

    if (validSign !== sign) {
      console.error("Invalid OTpay signature", req.body);
      return res.status(400).send("Invalid sign");
    }

    // ✅ Extra safety: check status values
    if (!["1", "2"].includes(status)) {
      return res.status(400).send("Invalid status");
    }

    // ✅ Find transaction
    const tx = await Transaction.findOne({ txid: merchantOrderId });
    if (!tx) {
      console.error("Transaction not found:", merchantOrderId);
      return res.status(404).send("Transaction not found");
    }

    // ✅ Prevent double-processing
    if (tx.status !== "pending") {
      return res.send("Already processed");
    }

    const user = await User.findById(tx.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    if (status === "1") {
      // ✅ Successful
      tx.status = "approved";

      if (tx.type === "deposit") {
        user.balance += tx.amount;
        user.totalDeposit += tx.amount;
      } else if (tx.type === "withdraw") {
        // Don't subtract here — already subtracted at request time
        user.totalWithdraw += tx.amount;
      }

    } else if (status === "2") {
      // ❌ Failed
      tx.status = "failed";

      if (tx.type === "withdraw") {
        // Refund withdrawal
        user.balance += tx.amount;
      }
    }

    await user.save();
    await tx.save();

    res.send("success");
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
