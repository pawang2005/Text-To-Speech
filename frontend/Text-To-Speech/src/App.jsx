import { useState, useEffect } from "react";

function App() {
  const [languages, setLanguages] = useState([]);
  const [voices, setVoices] = useState([]);
  const [sayVoice, setSayVoice] = useState("");
  const [tText, setTText] = useState("");
  const [text, setText] = useState("");
  const [lang, setLang] = useState("");
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const url =
          "https://list-of-all-countries-and-languages-with-their-codes.p.rapidapi.com/languages";
        const options = {
          method: "GET",
          headers: {
            "x-rapidapi-key":
              "ebbc3f6bd9mshc6d0c50c48feec0p12c56ajsn652b3502a188",
            "x-rapidapi-host":
              "list-of-all-countries-and-languages-with-their-codes.p.rapidapi.com",
          },
        };
        const response = await fetch(url, options);
        const data = await response.json();
        setLanguages(data);
      } catch (error) {
        console.error("Error fetching languages:", error);
      }
    };

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      setVoices(voices);
    };

    speechSynthesis.addEventListener("voiceschanged", loadVoices);

    fetchLanguages();
    loadVoices();
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);
  const handleOnChange = async (e) => {
    setText(e.target.value);
  };
  const handleOnSelect = (index) => {
    setSayVoice(index);
  };
  const handleOnSelectLang = (e) => {
    console.log("Selected language code:", e);
    setLang(e);
  };

  const handlePlay = async () => {
    try {
      const response = await fetch("http://loacalhost:3000/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ text, lang }),
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      if (data.success) {
        console.log("Translated text:", data.translatedData);
        setTText(data.ogTranslatedData);
        const utterance = new SpeechSynthesisUtterance();
        utterance.text = data.translatedData;
        utterance.lang = lang;
  
        const matchingVoice = voices.find((voice) =>
          voice.lang.toLowerCase().startsWith(lang.toLowerCase())
        );
  
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
  
        console.log("Speaking with config:", {
          text: utterance.text,
          lang: utterance.lang,
          voice: utterance.voice ? utterance.voice.name : "default",
        });
  
        speechSynthesis.speak(utterance);
      } else {
        console.error(
          "Error in processing the text on the server:",
          data.message
        );
      }
    } catch (error) {
      console.error("Error sending text to backend:", error);
    }
  };

  return (
    <>
      <body className="bg-black flex justify-center items-center">
        <div className="bg-white min-h-screen shadow-md flex flex-col gap-6 rounded-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-semibold text-gray-800 text-center">
            TTS - SPH
          </h1>
          <textarea
            name=""
            id=""
            className="w-full h-32 p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg resize-none"
            placeholder="Type Something Here... "
            onChange={(e) => handleOnChange(e)}
          ></textarea>
          <textarea
          readOnly
            name=""
            id=""
            className="w-full h-32 p-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg resize-none"
            value={tText}
          ></textarea>

          <div>
            <label
              htmlFor="languageSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Language
            </label>
            <select
              name=""
              id="languageSelect"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => {
                handleOnSelectLang(e.target.value);
              }}
            >
              {languages.map(({ name, code }) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="voiceSelect"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Select Voice
            </label>
            <select
              name=""
              id="voiceSelect"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleOnSelect(e.target.value)}
            >
              {voices.map((voice, index) => (
                <option key={index} value={index}>
                  {voice.name} - {voice.lang}
                </option>
              ))}
            </select>
          </div>

          <button
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            id="playButton"
            onClick={handlePlay}
          >
            Play Text
          </button>
        </div>
      </body>
    </>
  );
}

export default App;
