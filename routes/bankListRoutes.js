import express from "express";
import { getBankList } from "../controllers/bankController.js";

const router = express.Router();

router.get("/", getBankList); // GET /api/banks

export default router;
