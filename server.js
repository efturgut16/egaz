const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

app.post("/getPrice", async (req, res) => {
  const { city } = req.body;
  if (!city) return res.status(400).json({ error: "city gerekli" });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    await page.goto("https://www.aygaz.com.tr/fiyatlar/otogaz", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    await page.click("div[class*='control']");
    await page.keyboard.type(city);
    await page.keyboard.press("Enter");

    await page.waitForFunction(
      () => document.body.innerText.includes("TL/lt"),
      { timeout: 20000 }
    );

    const price = await page.evaluate(() => {
      const match = document.body.innerText.match(/([0-9]+,[0-9]+)\s*TL\/lt/);
      return match ? match[1] : null;
    });

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
  console.log("Server çalışıyor...");
});