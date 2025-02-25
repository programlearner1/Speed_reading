import React, { useState, useEffect, useRef } from "react";
import { getDocument } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

interface PDFViewerProps {
  file: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  // State variables
  const [speed, setSpeed] = useState<number>(1000); // Speed in milliseconds
  const [numWords, setNumWords] = useState<number>(3); // Words per highlight
  const [words, setWords] = useState<string[]>([]); // Extracted words
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Current reading position
  const [isReading, setIsReading] = useState<boolean>(false); // Controls start/stop
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null); // Stores interval reference
  const [theme, setTheme] = useState<"theme1" | "theme2">("theme1"); // Theme state
  const [isHighlighterOn, setIsHighlighterOn] = useState<boolean>(false); // Highlighter state
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set()); // Track highlighted words
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(false); // TTS state

  // Refs
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const wordElementsRef = useRef<(HTMLSpanElement | null)[]>([]);

  // Theme 1 styles
  const theme1Styles = {
    container: {
      backgroundColor: "white",
      color: "rgb(201,197,197)",
    },
    button: {
      padding: "8px 16px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
    },
    dropdown: {
      padding: "5px 10px",
      backgroundColor: "#333",
      color: "#fff",
      borderRadius: "5px",
      border: "none",
    },
    label: {
      fontWeight: "bold" as const,
      color: "black" as const,
    },
    textHighlight: {
      color: "black",
    },
  };

  // Theme 2 styles
  const theme2Styles = {
    container: {
      backgroundColor: "#f5f5f5",
      color: "#333",
      fontFamily: "'Arial', sans-serif",
    },
    button: {
      padding: "8px 16px",
      backgroundColor: "#007bff",
      color: "#fff",
      border: "none",
      borderRadius: "5px",
      cursor: "pointer",
      transition: "background-color 0.3s ease",
    },
    dropdown: {
      padding: "5px 10px",
      backgroundColor: "#333",
      color: "#fff",
      borderRadius: "5px",
      border: "none",
    },
    label: {
      fontWeight: "bold",
      color: "#333",
    },
    textHighlight: {
      color: "#007bff",
    },
  };

  // Current theme styles
  const currentTheme = theme === "theme1" ? theme1Styles : theme2Styles;

  // Extract text from PDF
  useEffect(() => {
    if (!file) return;

    const extractText = async () => {
      try {
        const loadingTask = getDocument(file);
        const pdf = await loadingTask.promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          extractedText += textContent.items.map((item: any) => item.str).join(" ") + " ";
        }

        setWords(extractedText.trim().split(/\s+/)); // Store words and remove extra spaces
      } catch (error) {
        console.error("Error extracting text from PDF:", error);
      }
    };

    extractText();
  }, [file]);

  // Function to start reading
  const startReading = () => {
    if (intervalId) {
      clearInterval(intervalId); // Clear any existing interval before starting a new one
    }
    const id = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + numWords >= words.length ? 0 : prevIndex + numWords)); // Advance based on numWords
    }, speed);
    setIntervalId(id);
    setIsReading(true);

    // Resume TTS if enabled
    if (isTTSEnabled) {
      window.speechSynthesis.resume();
    }
  };

  // Function to stop reading
  const stopReading = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsReading(false);

    // Pause TTS if enabled
    if (isTTSEnabled) {
      window.speechSynthesis.pause();
    }
  };

  // Restart the reading process when speed or numWords changes (if already reading)
  useEffect(() => {
    if (isReading) {
      startReading();
    }
  }, [speed, numWords]);

  // Smooth scroll the page as the reader moves and center the current word
  const smoothScrollToWord = () => {
    if (textContainerRef.current && wordElementsRef.current) {
      const container = textContainerRef.current;
      const currentWordElement = wordElementsRef.current[currentIndex];
      if (currentWordElement) {
        const rect = currentWordElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const wordCenterY = rect.top + rect.height / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;
        const distanceToScroll = wordCenterY - containerCenterY;

        const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

        const start = container.scrollTop;
        const duration = 300; // Scroll duration in milliseconds
        let startTime: number | null = null;

        const scroll = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const timeElapsed = timestamp - startTime;
          const progress = Math.min(timeElapsed / duration, 1);
          const easing = easeInOutQuad(progress);
          container.scrollTop = start + easing * distanceToScroll;

          if (progress < 1) {
            requestAnimationFrame(scroll);
          }
        };

        requestAnimationFrame(scroll);
      }
    }
  };

  // Scroll to the current word when index changes
  useEffect(() => {
    if (currentIndex < words.length) {
      smoothScrollToWord();
    }
  }, [currentIndex, words.length]);

  // TTS: Read the current words being highlighted
  useEffect(() => {
    if (isTTSEnabled && isReading) {
      const utterance = new SpeechSynthesisUtterance(words.slice(currentIndex, currentIndex + numWords).join(" "));
      utterance.rate = 1; // Default speed
      utterance.onend = () => {
        // Automatically advance to the next set of words after TTS finishes
        if (isReading) {
          setCurrentIndex((prevIndex) => (prevIndex + numWords >= words.length ? 0 : prevIndex + numWords));
        }
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [currentIndex, isTTSEnabled, isReading, words, numWords]);

  // Toggle TTS
  const toggleTTS = () => {
    if (isTTSEnabled) {
      window.speechSynthesis.cancel(); // Stop TTS if it's already running
    }
    setIsTTSEnabled((prev) => !prev);
  };

  // Toggle highlighter
  const toggleHighlighter = () => {
    setIsHighlighterOn((prev) => !prev);
  };

  // Handle word click for highlighting
  const handleWordClick = (index: number) => {
    if (isHighlighterOn) {
      setHighlightedWords((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(index)) {
          newSet.delete(index); // Remove highlight if already highlighted
        } else {
          newSet.add(index); // Add highlight
        }
        return newSet;
      });
    }
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        padding: "20px",
        ...currentTheme.container,
      }}
    >
      {/* Theme Dropdown and Highlighter Toggle */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "20px",
          zIndex: 10,
          display: "flex",
          gap: "10px",
        }}
      >
        <label style={{ ...currentTheme.label, marginRight: "10px" }}>Theme:</label>
        <select
          onChange={(e) => setTheme(e.target.value as "theme1" | "theme2")}
          value={theme}
          style={currentTheme.dropdown}
        >
          <option value="theme1">Theme 1</option>
          <option value="theme2">Theme 2</option>
        </select>

        {/* Highlighter Toggle Switch */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <label style={{ ...currentTheme.label }}>Highlighter:</label>
          <div
            onClick={toggleHighlighter}
            style={{
              width: "50px",
              height: "25px",
              backgroundColor: isHighlighterOn ? "#28a745" : "#dc3545",
              borderRadius: "25px",
              position: "relative",
              cursor: "pointer",
              transition: "background-color 0.3s ease",
            }}
          >
            <div
              style={{
                width: "21px",
                height: "21px",
                backgroundColor: "white",
                borderRadius: "50%",
                position: "absolute",
                top: "2px",
                left: isHighlighterOn ? "27px" : "2px",
                transition: "left 0.3s ease",
              }}
            />
          </div>
        </div>
      </div>

      {/* Controls (Speed, Words, Start/Stop) */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "20px",
          zIndex: 10,
          display: "flex",
          flexDirection: "row",
          gap: "10px",
        }}
      >
        <div>
          <label style={{ ...currentTheme.label, marginRight: "10px" }}>Speed:</label>
          <select
            onChange={(e) => setSpeed(Number(e.target.value))}
            value={speed}
            style={currentTheme.dropdown}
          >
            <option value={2000}>0.25</option>
            <option value={1500}>0.5</option>
            <option value={1100}>0.75</option>
            <option value={1000}>Normal</option>
            <option value={700}>1.25</option>
            <option value={500}>1.5</option>
            <option value={300}>1.75</option>
            <option value={100}>2</option>
          </select>
        </div>
        <div>
          <label style={{ ...currentTheme.label, marginRight: "10px" }}>Words:</label>
          <select
            onChange={(e) => setNumWords(Number(e.target.value))}
            value={numWords}
            style={currentTheme.dropdown}
          >
            <option value={3}>3 Words</option>
            <option value={4}>4 Words</option>
            <option value={5}>5 Words</option>
            <option value={6}>6 Words</option>
            <option value={7}>7 Words</option>
          </select>
        </div>
        {/* Start & Stop Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={startReading}
            disabled={isReading}
            style={currentTheme.button}
          >
            Start
          </button>
          <button
            onClick={stopReading}
            disabled={!isReading}
            style={{
              ...currentTheme.button,
              backgroundColor: "#dc3545",
            }}
          >
            Stop
          </button>
        </div>
      </div>

      {/* TTS Toggle Switch */}
      <div
        style={{
          position: "absolute",
          top: "100px",
          left: "20px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <label style={{ ...currentTheme.label }}>TTS:</label>
        <div
          onClick={toggleTTS}
          style={{
            width: "50px",
            height: "25px",
            backgroundColor: isTTSEnabled ? "#28a745" : "#dc3545",
            borderRadius: "25px",
            position: "relative",
            cursor: "pointer",
            transition: "background-color 0.3s ease",
          }}
        >
          <div
            style={{
              width: "21px",
              height: "21px",
              backgroundColor: "white",
              borderRadius: "50%",
              position: "absolute",
              top: "2px",
              left: isTTSEnabled ? "27px" : "2px",
              transition: "left 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Text Display with Highlighting */}
      <div
        ref={textContainerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          marginTop: "140px",
        }}
      >
        <p
          style={{
            fontSize: "18px",
            lineHeight: "1.6",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {words.map((word, index) => (
            <span
              ref={(el) => (wordElementsRef.current[index] = el)}
              key={index}
              onClick={() => handleWordClick(index)}
              style={{
                color:
                  highlightedWords.has(index)
                    ? "black" // Highlighted words are black
                    : index >= currentIndex && index < currentIndex + numWords
                    ? currentTheme.textHighlight.color // Reading highlight color
                    : currentTheme.container.color, // Default color
                fontWeight: highlightedWords.has(index) ? "bold" : "normal", // Bold for highlighted words
                transition: "color 0.3s ease-in-out, font-weight 0.3s ease-in-out",
                marginRight: "5px",
                cursor: isHighlighterOn ? "pointer" : "default",
              }}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </div>
  );
};

export default PDFViewer;