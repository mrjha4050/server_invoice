import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import invoicesRouter from "./routes/invoiceRoutes";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();

// const allowedOrigins = ["httpss://client-invoice-gen.vercel.app"];  


app.use(cors({
  origin: "https://client-invoice-gen.vercel.app",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));


app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://client-invoice-gen.vercel.app");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI || "")
  .then(() => {
    console.log("✅ MongoDB connected...");
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error:", error.message);
  });

app.get("/", (req, res) => {
  res.send("Server is running...");
});
app.use("/api/invoices", invoicesRouter);
app.use("/api/auth", authRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Server Error Object:", err);

  const errorMessage = err?.message || "An unknown error occurred.";
  const statusCode = err?.status || 500;

  res.status(statusCode).json({ message: errorMessage });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});