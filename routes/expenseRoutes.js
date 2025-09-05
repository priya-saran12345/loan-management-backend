import express from "express";
import authUser from "../middlewares/authUser.js";
import { addExpense, getExpenses, deleteExpense } from "../controllers/expenseController.js";

const expenseRouter = express.Router();

expenseRouter.post("/", authUser, addExpense);
expenseRouter.get("/", authUser, getExpenses);
expenseRouter.delete("/:id", authUser, deleteExpense);

export default expenseRouter;
