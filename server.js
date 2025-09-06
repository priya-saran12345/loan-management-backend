import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import connectDB from "./configs/db.js";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import userRouter from "./routes/userRoute.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import customerRoutes from './routes/customerRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import walletRoutes from './routes/walletRoutes.js';
import extraIncomeRoutes from './routes/extraIncomeRoutes.js';
import customerRoutesLra from "./routes/customerRoutesLra.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 4000;

// Allowed origins
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://loan-management-frontend.vercel.app"
];

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

// Database connection and server start
(async () => {
    await connectDB();
    // Routes
    app.get("/api", (req, res) => res.send("Loan Management System API"));
    app.use("/api/user", userRouter);
    app.use("/api/employees", employeeRoutes);
    app.use("/api/income", incomeRoutes);
    app.use("/api/expense", expenseRoutes);
    app.use('/api/customers-stl', customerRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/wallet', walletRoutes);
    app.use('/api/extra-income', extraIncomeRoutes);
    app.use('/api/customers-lra', customerRoutesLra);

    // Serve frontend
    app.use(express.static(path.join(__dirname, "frontend/build")));
    app.get("/*", (req, res) => {
        res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
    });

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
})();
