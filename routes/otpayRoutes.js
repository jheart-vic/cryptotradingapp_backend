// routes/otpayRoutes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import { requestDeposit, requestWithdraw } from "../controllers/transactionController.js";
import OTpay from "../helpers/otpay.js";

const router = express.Router();

router.post("/order", auth, requestDeposit);
router.post("/payout", auth, requestWithdraw);

router.post("/balance", auth, async (req, res) => {
  try {
    const data = await OTpay.balanceQuery();
    res.json(data);
  } catch (err) {
    console.error("balance query error", err);
    res.status(500).json({ msg: err.message });
  }
});

export default router;
