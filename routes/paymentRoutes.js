// routes/paymentRoutes.js
import express from 'express';
import {
    getPayments,
    getPaymentSummary
} from '../controllers/paymentController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

router.get("/", authUser, getPayments);
router.get("/summary", authUser, getPaymentSummary);

export default router;