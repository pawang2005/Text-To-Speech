const express = require("express");
const app = express();
const cors = require("cors");
const transliteration = require('transliteration');
const fetch = require('node-fetch');

// Define allowed origins
const allowedOrigins = [
  'https://text-to-speech-pago.vercel.app',  // Your frontend URL
  'http://localhost:3000',  // Local development URL
  'http://localhost:5173'   // Vite's default development URL
];

// CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

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

// For Vercel, we need to export the app
module.exports = app;

// Only listen if we're running directly (not on Vercel)
if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}