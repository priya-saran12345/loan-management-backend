import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  description: { type: String }
}, { timestamps: true });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
