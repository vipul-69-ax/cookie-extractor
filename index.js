import express from "express";
import puppeteer from "puppeteer-core"; // Use "puppeteer-core" instead of "puppeteer"
import { platform as _platform, homedir } from "os";
import { join } from "path";

const app = express();
const PORT = process.env.PORT || 5000;

const detectUserDataDir = () => {
    const platform = _platform();
    if (platform === "win32") {
        return join(process.env.LOCALAPPDATA, "Google/Chrome/User Data/Default");
    } else if (platform === "darwin") {
        return join(homedir(), "Library/Application Support/Google/Chrome/Default");
    } else if (platform === "linux") {
        return join(homedir(), ".config/google-chrome/Default");
    }
    throw new Error("Unsupported OS");
};

const extractCookies = async (url) => {
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            executablePath: process.env.CHROME_PATH || "/usr/bin/chromium-browser",
            userDataDir: detectUserDataDir(),
            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
            ],
        });

        const page = await browser.newPage();
        await page.goto(url, { waitUntil: "networkidle2" });

        let isLoggedIn = await page.evaluate(() => document.cookie.includes("ds_user_id") || document.cookie.includes("c_user"));

        if (!isLoggedIn) {
            await browser.close();
            return { error: "Not logged in. Please log in first." };
        }

        const cookies = await page.cookies();
        await browser.close();
        return cookies;
    } catch (error) {
        console.error("Error extracting cookies:", error);
        return { error: "Failed to extract cookies." };
    }
};

app.get("/api/cookies", async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).json({ error: "Missing URL parameter" });

    const cookies = await extractCookies(url);
    res.json(cookies);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
