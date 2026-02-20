const express = require("express");
const { chromium } = require("playwright");

const app = express();

/* =========================
   🔥 MANUEL CORS AYARI
   ========================= */
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://egazlpg.com");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Preflight request (OPTIONS) için
app.options("*", (req, res) => {
  res.sendStatus(200);
});

app.use(express.json());

/* =========================
   📌 FİYAT ENDPOINT
   ========================= */
app.post("/getPrice", async (req, res) => {
  const { city } = req.body;

  if (!city) {
    return res.status(400).json({ error: "city gerekli" });
  }

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto("https://www.aygaz.com.tr/fiyatlar/otogaz", {
      waitUntil: "networkidle",
      timeout: 60000
    });

    // şehir seç
    await page.click("div[class*='control']");
    await page.keyboard.type(city);
    await page.keyboard.press("Enter");

    // fiyatın gelmesini bekle
    await page.waitForSelector("text=TL/lt", { timeout: 20000 });

    const bodyText = await page.textContent("body");

    const match = bodyText.match(/([0-9]+,[0-9]+)\s*TL\/lt/);
    const price = match ? match[1] : null;

    await browser.close();

    if (!price) {
      return res.status(500).json({ error: "Fiyat bulunamadı" });
    }

    return res.json({
      city,
      price,
      unit: "TL/lt",
      date: new Date().toLocaleDateString("tr-TR")
    });

  } catch (error) {
    if (browser) await browser.close();
    return res.status(500).json({
      error: "Sunucu hatası",
      detail: error.message
    });
  }
});

/* =========================
   🚀 SERVER START
   ========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server çalışıyor...");
});