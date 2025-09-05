import express from "express";
import {
  createLRACustomer,
  deleteLRACustomer,
  getAllLRACustomers,
  getLRACustomer,
  updateLRACustomer,
  updateEMIStatus,
  getPaymentHistory,
  getEMIDetails,
  collectPayment,
  getLRACustomerForEdit,
  getOverduePaymentsList
} from "../controllers/CustomerControllerLra.js";
import authUser from "../middlewares/authUser.js";

const router = express.Router();

// All routes will be prefixed with /api/customers-lra when used in server.js
router.post("/", authUser, createLRACustomer);
router.get("/", getAllLRACustomers);
router.get("/:id", getLRACustomer);
router.get('/:id/edit', getLRACustomerForEdit);
router.put("/:id", updateLRACustomer);
router.delete("/:id", deleteLRACustomer);
router.patch("/:id/emi", updateEMIStatus);
router.get("/overdue", authUser, getOverduePaymentsList);


// Add these new routes
router.get("/:id/payments", getPaymentHistory);
router.get("/:id/emis", getEMIDetails);
router.post("/collect-payment", authUser, collectPayment);

export default router;