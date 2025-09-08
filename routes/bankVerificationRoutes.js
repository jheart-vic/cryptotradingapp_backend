// routes/otpayRoutes.js
import express from "express";
import { verifyAccount } from "../controllers/verifyAccountController.js";

const router = express.Router();

router.post("/", verifyAccount);

export default router;
