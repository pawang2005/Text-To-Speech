const express = require("express");
const app = express();
const cors = require("cors");
const transliteration = require('transliteration');
const fetch = require('node-fetch');

const main_url = 'https://api.mymemory.translated.net/get?q=';

// Define allowed origins
const allowedOrigins = [
  'https://text-to-speech-pago.vercel.app',  // Production URL
  'https://text-to-speech-dusky-alpha.vercel.app/',
  'http://localhost:5173',                    // Vite development URL
  'http://localhost:3000'                     // Alternative local URL
];

// CORS Middleware with dynamic origin checking
app.use(cors({
  origin: function (origin, callback) {
    // Check if origin is in allowedOrigins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(200);
  } else {
    res.sendStatus(403);
  }
});

// Global middleware to set dynamic CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  next();
});

app.use(express.json());

app.post("/api/translate", async (req, res) => {
  const { text, lang } = req.body;
  
  // Check if required fields are provided
  if (!text || !lang) {
    return res.status(400).json({ 
      success: false, 
      message: "Text and language code are required" 
    });
  }

  try {
    // Fetching translation from external API
    let response;
    try {
      response = await fetch(`${main_url}${encodeURIComponent(text)}&langpair=en|${lang}`);
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return res.status(500).json({
        success: false,
        message: "Error fetching data from translation service",
      });
    }

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return res.status(500).json({
        success: false,
        message: "Error parsing translation response",
      });
    }

    // Check if translation data is valid
    if (!data.matches || data.matches.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Translation data not found",
      });
    }

    const translatedData = data.matches[0].translation;

    // Transliterate to Latin script
    let romanizedText;
    try {
      romanizedText = transliteration.transliterate(translatedData);
    } catch (transliterateError) {
      console.error("Transliteration error:", transliterateError);
      romanizedText = translatedData; // Fallback to the original translation if transliteration fails
    }

    // Respond with translated and transliterated data
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

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
