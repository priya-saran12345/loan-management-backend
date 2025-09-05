import express from "express";
import { 
  getExtraIncome,
  addExtraIncome
} from "../controllers/extraIncomeController.js";
import authUser from "../middlewares/authUser.js";

const extraIncomeRouter = express.Router();

extraIncomeRouter.get("/", authUser, getExtraIncome);
extraIncomeRouter.post("/", authUser, addExtraIncome);

export default extraIncomeRouter;