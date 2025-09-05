import express from "express";
import { 
  getWallet, 
  getWalletTransactions,
  addToWallet,
  withdrawFromWallet,
  deleteTransaction
} from "../controllers/walletController.js";
import authUser from "../middlewares/authUser.js";

const walletRouter = express.Router();

walletRouter.get("/", authUser, getWallet);
walletRouter.get("/transactions", authUser, getWalletTransactions);
walletRouter.post("/deposit", authUser, addToWallet);
walletRouter.post("/withdraw", authUser, withdrawFromWallet);
walletRouter.delete("/transactions/:transactionId", authUser, deleteTransaction);

export default walletRouter;