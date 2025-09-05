import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  getCustomerPayments,
  collectPayment,
  getOverduePayments,
  getCustomerForEdit,
  getCustomerEMIs,
  deleteCustomer,
  getCustomerStats,
  calculateEMI
} from '../controllers/customerController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

router.post("/", authUser, createCustomer);
router.get("/", authUser, getCustomers);
router.get("/stats", authUser, getCustomerStats);
router.post("/collect-payment", authUser, collectPayment);
router.get("/overdue/list", authUser, getOverduePayments);
router.post("/calculate-emi", authUser, calculateEMI);
router.get("/:id", authUser, getCustomer);
router.get("/:id/edit", authUser, getCustomerForEdit);
router.put("/:id", authUser, updateCustomer);
router.delete("/:id", authUser, deleteCustomer);
router.get("/:id/payments", authUser, getCustomerPayments);
router.get("/:id/emis", authUser, getCustomerEMIs);

export default router;