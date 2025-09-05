import Expense from "../models/Expense.js";

export const addExpense = async (req, res) => {
  try {
    const {amount, date, description } = req.body;

    if (!amount || !date) {
      return res.json({ success: false, message: "Missing required fields" });
    }

    const expense = await Expense.create({
      userId: req.userId,
      amount,
      date,
      description
    });

    res.json({ success: true, expense });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.userId }).sort({ date: -1 });
    res.json({ success: true, expenses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.deleteOne({ _id: id, userId: req.userId });
    res.json({ success: true, message: "Expense deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
