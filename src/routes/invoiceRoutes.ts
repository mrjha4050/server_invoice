import express from "express";
import puppeteer from "puppeteer";
import authMiddleware, { AuthenticatedRequest } from "../authMiddleware";

const router = express.Router();
router.post("/generate-pdf", authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { htmlContent } = req.body;

    if (!htmlContent) {
      res.status(400).json({ message: "HTML content is required." });
      return;
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "load" });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    console.log("PDF Buffer Size:", pdfBuffer.length); // Debug buffer size
    if (pdfBuffer.length === 0) {
      throw new Error("Generated PDF is empty.");
    }

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=invoice.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", (error as Error).message);
    res.status(500).json({ message: "Failed to generate PDF.", error: (error as Error).message });
  }
});

export default router;