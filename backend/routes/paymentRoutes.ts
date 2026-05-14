import express from "express";
import {
  generateStaticPix,
  createPixPayment,
  checkPayment,
  manualPay,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/generate-static-pix", generateStaticPix);
router.post("/create-pix-payment", createPixPayment);
router.get("/check-payment/:paymentId", checkPayment);
router.post("/manual-pay", manualPay);

export default router;
