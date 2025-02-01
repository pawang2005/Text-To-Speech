const express = require("express");
const app = express();
const cors = require("cors");
const transliteration = require('transliteration');
const fetch = require('node-fetch');  // Make sure you have node-fetch installed

let main_url = 'https://api.mymemory.translated.net/get?q=';

app.use(express.json());

app.use(
  cors({
    origin: ["https://text-to-speech-pago.vercel.app/", "https://text-to-speech-dusky-alpha.vercel.app/"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: "*",
    credentials:true
  })
);

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
