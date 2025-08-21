// controllers/transactionController.js
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import Settings from "../models/Settings.js";
import OTpay from "../helpers/otpay.js";
import { applyReferralBonus } from "../utils/referralBonus.js";
import {  giveSpinToUpline } from "../controllers/spinController.js";
import History from "../models/History.js";

// ----------- CREATE DEPOSIT ORDER -----------
export const requestDeposit = async (req, res) => {
  const { amount, firstName, lastName, mobile, email, payType } = req.body;
  try {
    const settings = await Settings.findOne();
    if (settings?.depositEnabled === false) {
      return res.status(403).json({ msg: "Deposits are currently disabled" });
    }

    // Create transaction
    let tx = await Transaction.create({
      userId: req.user._id,
      type: "deposit",
      amount: Number(amount),
      method: "otpay",
      status: "pending",
    });

    const merchantOrderId = tx._id.toString();

    // Call OTpay
    const payload = { firstName, lastName, mobile, email, payType };
    const otRes = await OTpay.createDepositOrder({
      merchantOrderId,
      amount,
      payload,
    });

    tx.merchantOrderId = merchantOrderId;
    tx.gatewayResponse = otRes;
    tx.gatewayOrderId = otRes?.data?.orderId || null;
    await tx.save();

    res.json({ msg: "Deposit initiated", tx, otRes });
  } catch (err) {
    console.error("requestDeposit error", err);
    res.status(500).json({ msg: err.message });
  }
};

// ----------- CREATE WITHDRAWAL ORDER -----------
export const requestWithdraw = async (req, res) => {
  const { amount, bankName, accountNumber, accountName, extra } = req.body;
  try {
    const settings = await Settings.findOne();
    if (settings?.withdrawEnabled === false) {
      return res.status(403).json({ msg: "Withdrawals are currently disabled" });
    }

    const user = await User.findById(req.user._id);
    if (!user || user.balance < amount) {
      return res.status(400).json({ msg: "Insufficient balance" });
    }

    // Deduct immediately
    user.balance -= amount;
    await user.save();

    // Create transaction
    const tx = await Transaction.create({
      userId: user._id,
      type: "withdraw",
      amount,
      bankName,
      accountNumber,
      accountName,
      method: "otpay",
      status: "pending",
    });

    const merchantOrderId = tx._id.toString();

    // Call OTpay
    const otRes = await OTpay.createWithdrawalOrder({
      merchantOrderId,
      amount,
      bankName,
      accountNumber,
      accountName,
      extra,
    });

    tx.merchantOrderId = merchantOrderId;
    tx.gatewayResponse = otRes;
    tx.gatewayOrderId = otRes?.data?.payoutId || null;
    await tx.save();

    res.json({ msg: "Withdrawal initiated", tx, otRes });
  } catch (err) {
    console.error("requestWithdraw error", err);
    res.status(500).json({ msg: err.message });
  }
};

// ----------- HANDLE WEBHOOK CALLBACK -----------
// export const handleOTpayWebhook = async (req, res) => {
//   try {
//     const body = req.body || {};
//     const { merchantOrderId, status } = body;

//     // Verify signature
//     let valid = false;
//     if (body.payAmount !== undefined) {
//       valid = OTpay.verifyDepositCallback(body);
//     } else {
//       valid = OTpay.verifyWithdrawalCallback(body);
//     }
//     if (!valid) {
//       console.warn("OTpay webhook invalid sign", body);
//       return res.status(400).send("invalid sign");
//     }

//     // Find transaction
//     let tx = null;
//     if (merchantOrderId && mongoose.Types.ObjectId.isValid(merchantOrderId)) {
//       tx = await Transaction.findById(merchantOrderId);
//     }
//     if (!tx) {
//       tx = await Transaction.findOne({
//         $or: [{ gatewayOrderId: merchantOrderId }, { merchantOrderId }],
//       });
//     }
//     if (!tx) {
//       console.error("Webhook transaction not found:", merchantOrderId);
//       return res.status(404).send("transaction not found");
//     }

//     // Prevent double-processing
//     if (tx.status !== "pending") {
//       return res.send("already processed");
//     }

//     // Update transaction status
//     if (status === "1") {
//       tx.status = "approved";
//     } else if (status === "2") {
//       tx.status = "failed";
//     } else {
//       tx.status = "pending";
//     }
//     tx.gatewayResponse = body;
//     tx.gatewayOrderId = body.orderId || tx.gatewayOrderId;

//     // Business rules
//     if (status === "1") {
//       if (tx.type === "deposit") {
//         const user = await User.findById(tx.userId);
//         if (user) {
//           const credit = Number(body.payAmount || body.amount || 0);
//           user.balance += credit;
//           user.totalDeposit = (user.totalDeposit || 0) + credit;
//           await user.save();

//           // Referral bonus (safe)
//           try {
//             await applyReferralBonus(user._id, credit);
//           } catch (err) {
//             console.error("Referral bonus error:", err);
//           }

//           // Spin reward (safe, only first deposit)
//           try {
//             const txCount = await Transaction.countDocuments({
//               userId: user._id,
//               type: "deposit",
//               status: "approved",
//             });
//             if (txCount === 1) {
//               await giveSpinToUpline(user._id);
//             }
//           } catch (err) {
//             console.error("Spin reward error:", err);
//           }
//         }
//       } else if (tx.type === "withdraw") {
//         const user = await User.findById(tx.userId);
//         if (user) {
//           user.totalWithdraw = (user.totalWithdraw || 0) + tx.amount;
//           await user.save();
//         }
//       }
//     } else if (status === "2" && tx.type === "withdraw") {
//       // Refund failed withdrawal
//       const user = await User.findById(tx.userId);
//       if (user) {
//         user.balance += tx.amount;
//         await user.save();
//       }
//     }

//     await tx.save();

//     res.send("success");
//   } catch (err) {
//     console.error("Webhook processing error", err);
//     res.status(500).send("server error");
//   }
// };

export const handleOTpayWebhook = async (req, res) => {
  try {
    const body = req.body || {};
    const { merchantOrderId, status } = body;

    // Verify signature
    let valid = false;
    if (body.payAmount !== undefined) {
      valid = OTpay.verifyDepositCallback(body);
    } else {
      valid = OTpay.verifyWithdrawalCallback(body);
    }
    if (!valid) {
      console.warn("❌ OTpay webhook invalid sign", body);
      return res.status(400).send("invalid sign");
    }

    // Find transaction
    let tx = null;
    if (merchantOrderId && mongoose.Types.ObjectId.isValid(merchantOrderId)) {
      tx = await Transaction.findById(merchantOrderId);
    }
    if (!tx) {
      tx = await Transaction.findOne({
        $or: [{ gatewayOrderId: merchantOrderId }, { merchantOrderId }],
      });
    }
    if (!tx) {
      console.error("❌ Webhook transaction not found:", merchantOrderId);
      return res.status(404).send("transaction not found");
    }

    // Prevent double-processing
    if (tx.status !== "pending") {
      return res.send("already processed");
    }

    // Update transaction status
    if (status === "1") {
      tx.status = "approved";
    } else if (status === "2") {
      tx.status = "failed";
    } else {
      tx.status = "pending";
    }
    tx.gatewayResponse = body;
    tx.gatewayOrderId = body.orderId || tx.gatewayOrderId;

    // --- Business rules & History logging ---
    if (status === "1") {
      if (tx.type === "deposit") {
        const user = await User.findById(tx.userId);
        if (user) {
          const credit = Number(body.payAmount || body.amount || 0);
          user.balance += credit;
          user.totalDeposit = (user.totalDeposit || 0) + credit;
          await user.save();

          // ✅ Log deposit history
          await History.create({
            user: user._id,
            type: "deposit",
            amount: credit,
            message: `Deposit of ₦${credit} approved`,
          });

          // Referral bonus (safe)
          try {
            await applyReferralBonus(user._id, credit);
          } catch (err) {
            console.error("Referral bonus error:", err);
          }

          // Spin reward (safe, only first deposit)
          try {
            const txCount = await Transaction.countDocuments({
              userId: user._id,
              type: "deposit",
              status: "approved",
            });
            if (txCount === 1) {
              await giveSpinToUpline(user._id);
            }
          } catch (err) {
            console.error("Spin reward error:", err);
          }
        }
      } else if (tx.type === "withdraw") {
        const user = await User.findById(tx.userId);
        if (user) {
          user.totalWithdraw = (user.totalWithdraw || 0) + tx.amount;
          await user.save();

          // ✅ Log withdrawal history
          await History.create({
            user: user._id,
            type: "withdrawal",
            amount: tx.amount,
            message: `Withdrawal of ₦${tx.amount} is Successful`,
          });
        }
      }
    } else if (status === "2" && tx.type === "withdraw") {
      // Refund failed withdrawal
      const user = await User.findById(tx.userId);
      if (user) {
        user.balance += tx.amount;
        await user.save();

        // ✅ Log refund history
        await History.create({
          user: user._id,
          type: "withdrawal",
          amount: tx.amount,
          message: `Withdrawal of ₦${tx.amount} failed and was refunded`,
        });
      }
    }

    await tx.save();

    res.send("success");
  } catch (err) {
    console.error("❌ Webhook processing error", err);
    res.status(500).send("server error");
  }
}