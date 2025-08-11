// routes/otpay.js
import express from "express";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import OTpay from "../helpers/otpay.js";

const router = express.Router();

router.post("/webhook", async (req, res) => {
  try {
    const { merchantOrderId, amount, sign, status } = req.body;

    // Verify signature
    const validSign = OTpay.generateSign(
      { merchantId: process.env.OTPAY_MERCHANT_ID || "999", merchantOrderId, amount: parseFloat(amount).toFixed(2) },
      "callback"
    );
    if (validSign !== sign) {
      return res.status(400).send("Invalid sign");
    }

    const tx = await Transaction.findById(merchantOrderId);
    if (!tx) return res.status(404).send("Transaction not found");
    if (tx.status !== "pending") return res.send("Already processed");

    const user = await User.findById(tx.userId);

    if (status === "1") {
      tx.status = "approved";
      if (tx.type === "deposit") {
        user.balance += tx.amount;
        user.totalDeposit += tx.amount;
      } else if (tx.type === "withdraw") {
        user.balance -= tx.amount;
        user.totalWithdraw += tx.amount;
      }
      await user.save();
    } else if (status === "2") {
      tx.status = "failed";
    }

    await tx.save();
    res.send("success");
  } catch (err) {
    res.status(500).send("server error");
  }
});

export default router;
