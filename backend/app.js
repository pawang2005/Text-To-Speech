const express = require("express");
const app = express();
const cors = require("cors");
const transliteration = require('transliteration');
const fetch = require('node-fetch');

const main_url = 'https://api.mymemory.translated.net/get?q=';

// CORS Middleware setup
app.use(cors({
  origin: 'https://text-to-speech-pago.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://text-to-speech-pago.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Parse JSON bodies
app.use(express.json());

// Global middleware to set CORS headers for all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://text-to-speech-pago.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.post("/api/translate", async (req, res) => {
  const { text, lang } = req.body;
 
  if (!text || !lang) {
    return res.status(400).json({
      success: false,
      message: "Text and language code are required"
    });
  }

  try {
    const response = await fetch(`${main_url}${encodeURIComponent(text)}&langpair=en|${lang}`);
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.matches || data.matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Translation data not found",
      });
    }

    const translatedData = data.matches[0].translation;
    const romanizedText = transliteration.transliterate(translatedData);

    return res.json({
      success: true,
      translatedData: romanizedText,
      message: "Text translation successful",
      ogTranslatedData: translatedData,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({
      success: false,
      message: "Translation failed due to an unexpected error",
    });
  }
});

// Export for Vercel
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}