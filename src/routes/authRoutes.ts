import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import User from "../models/User"; 
import crypto from "crypto";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  handler: (req: Request, res: Response) => {
    res.status(429).json({ message: "Too many login attempts, please try again later." });
  },
});

// **REGISTER**
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Invalid email format"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ name, email, password: hashedPassword });
      await newUser.save();

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// **LOGIN**
router.post(
  "/login",
  loginLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "1h" }
      );

      res.status(200).json({
        token,
        user: { id: user._id, name: user.name, email: user.email },
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// **FORGOT PASSWORD**
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Invalid email format")],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      const resetURL = `https://client-invoice-gen.vercel.app/reset-password?token=${resetToken}`;
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        to: email,
        subject: "Password Reset Request",
        html: `<p>You requested a password reset. Click the link below to reset your password:</p>
               <a href="${resetURL}">${resetURL}</a>`,
      });

      res.status(200).json({ message: "Password reset email sent!" });
    } catch (error) {
      console.error("Error during forgot-password:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// **RESET PASSWORD**
router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { token, password } = req.body;

    try {
      const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

      const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() }, // Token should not be expired
      });

      if (!user) {
        res.status(400).json({ message: "Invalid or expired token" });
        return;
      }

      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Error during reset-password:", error);
      res.status(500).json({ message: "Server error", error });
    }
  }
);

// **TEST ROUTE**
router.get("/test", (req, res) => {
  res.json({ message: "Auth route is working!" });
});

export default router;