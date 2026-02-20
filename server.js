const express = require("express");
const { chromium } = require("playwright");

const app = express();
app.use(express.json());

app.post("/getPrice", async (req, res) => {
  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "city gerekli" });

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://www.aygaz.com.tr/fiyatlar/otogaz", {
      waitUntil: "networkidle"
    });

    await page.click("div[class*='control']");
    await page.keyboard.type(city);
    await page.keyboard.press("Enter");

    await page.waitForSelector("text=TL/lt");

    const text = await page.textContent("body");

    const match = text.match(/([0-9]+,[0-9]+)\s*TL\/lt/);
    const price = match ? match[1] : null;

    await browser.close();

    if (!price) throw new Error("Fiyat bulunamadı");

    res.json({
      city,
      price,
      unit: "TL/lt",
      date: new Date().toLocaleDateString("tr-TR")
    });

  } catch (err) {
    if (browser) await browser.close();
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server çalışıyor");
});