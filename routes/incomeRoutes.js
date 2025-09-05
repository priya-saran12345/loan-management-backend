import express from "express";
import authUser from "../middlewares/authUser.js";
import { addIncome, getIncomes, deleteIncome } from "../controllers/incomeController.js";

const incomeRouter = express.Router();

incomeRouter.post("/", authUser, addIncome);
incomeRouter.get("/", authUser, getIncomes);
incomeRouter.delete("/:id", authUser, deleteIncome);

export default incomeRouter;
