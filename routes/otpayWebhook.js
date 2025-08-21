// routes/otpayWebhook.js
import express from "express";
import { handleOTpayWebhook } from "../controllers/transactionController.js";

const router = express.Router();

router.post("/", express.json(), handleOTpayWebhook);

export default router;
