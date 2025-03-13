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
  const [selectedFont, setSelectedFont] = useState<string>("Arial"); // Font state
  const [highlightedWords, setHighlightedWords] = useState<Set<number>>(new Set()); // Track highlighted words
  const [isTTSEnabled, setIsTTSEnabled] = useState<boolean>(false); // TTS state
  const [selectedWord, setSelectedWord] = useState<string | null>(null); // Selected word for meaning
  const [wordMeaning, setWordMeaning] = useState<string | null>(null); // Meaning of the selected word
  const [dialogPosition, setDialogPosition] = useState<{ top: number; left: number } | null>(null); // Position of the dialog box

  // Refs
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const wordElementsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Font options
  const fontOptions = [
    { value: "Arial", label: "Arial" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Georgia", label: "Georgia" },
    { value: "Verdana", label: "Verdana" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Merriweather", label: "Merriweather" },
  ];

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

  // Function to speak words using TTS
  const speakWords = () => {
    if (!isReading || !isTTSEnabled || currentIndex >= words.length) return;

    // Cancel any existing speech
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }

    // Get current chunk of words
    const currentChunk = words.slice(currentIndex, currentIndex + numWords).join(" ");
    
    const utterance = new SpeechSynthesisUtterance(currentChunk);
    currentUtteranceRef.current = utterance;
    
    // Calculate appropriate rate based on speed setting
    const baseRate = 1.0;
    const speedFactor = 1000 / speed;
    utterance.rate = Math.min(Math.max(baseRate * speedFactor, 0.5), 2.5);
    
    // Set voice properties
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onend = () => {
      if (!isReading) {
        currentUtteranceRef.current = null;
        return;
      }
      
      const nextIndex = currentIndex + numWords;
      if (nextIndex >= words.length) {
        stopReading();
        return;
      }
      
      currentUtteranceRef.current = null;
      setCurrentIndex(nextIndex);
    };

    utterance.onerror = (event) => {
      console.error('TTS Error occurred:', event.error);
      currentUtteranceRef.current = null;
      stopReading();
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Failed to start speech:', error);
      currentUtteranceRef.current = null;
      stopReading();
    }
  };

  // Effect to handle TTS when currentIndex changes
  useEffect(() => {
    if (isReading && isTTSEnabled) {
      // Small delay to ensure state is updated
      const timeoutId = setTimeout(() => {
        speakWords();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [currentIndex, isReading, isTTSEnabled]);

  // Start reading
  const startReading = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    // Reset current utterance
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }

    setCurrentIndex(0);
    setIsReading(true);

    if (!isTTSEnabled) {
      const id = setInterval(() => {
        setCurrentIndex(prevIndex => {
          const nextIndex = prevIndex + numWords;
          if (nextIndex >= words.length) {
            stopReading();
            return prevIndex;
          }
          return nextIndex;
        });
      }, speed);
      setIntervalId(id);
    }
  };

  // Stop reading
  const stopReading = () => {
    setIsReading(false);
    
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    if (isTTSEnabled && currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
  };

  // Handle speed/numWords changes
  useEffect(() => {
    if (isReading) {
      const currentPos = currentIndex;
      stopReading();
      
      // Small delay to ensure cleanup is complete
      setTimeout(() => {
        setCurrentIndex(currentPos);
        setIsReading(true);
      }, 50);
    }
  }, [speed, numWords]);

  // Toggle TTS
  const toggleTTS = () => {
    if (currentUtteranceRef.current) {
      window.speechSynthesis.cancel();
      currentUtteranceRef.current = null;
    }
    stopReading();
    setIsTTSEnabled(prev => !prev);
  };

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

  // Toggle highlighter
  const toggleHighlighter = () => {
    setIsHighlighterOn((prev) => !prev);
  };

  // Fetch word meaning from the API
  const fetchWordMeaning = async (word: string) => {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      const data = await response.json();
      if (data && data[0] && data[0].meanings && data[0].meanings[0] && data[0].meanings[0].definitions[0]) {
        setWordMeaning(data[0].meanings[0].definitions[0].definition);
      } else {
        setWordMeaning("Meaning not found");
      }
    } catch (error) {
      console.error("Error fetching word meaning:", error);
      setWordMeaning("Error fetching meaning");
    }
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

  // Handle mouse enter event for highlighted words
  const handleMouseEnter = (index: number, event: React.MouseEvent) => {
    if (highlightedWords.has(index)) {
      const word = words[index];
      setSelectedWord(word);
      fetchWordMeaning(word);
      const target = event.currentTarget as HTMLElement;
      if (target) {
        const rect = target.getBoundingClientRect();
        setDialogPosition({ top: rect.top, left: rect.left });
      }
    }
  };

  // Handle mouse leave event for highlighted words
  const handleMouseLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    // Check if the mouse is moving to the dialog box
    if (relatedTarget?.closest('.word-meaning-dialog')) {
      return;
    }
    setSelectedWord(null);
    setWordMeaning(null);
    setDialogPosition(null);
  };

  // Handle dialog mouse events
  const handleDialogMouseEnter = () => {
    // Keep the dialog visible while hovering over it
  };

  const handleDialogMouseLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    // Check if the mouse is moving back to the word
    if (relatedTarget?.closest('.highlighted-word')) {
      return;
    }
    setSelectedWord(null);
    setWordMeaning(null);
    setDialogPosition(null);
  };

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        padding: "20px",
        backgroundColor: theme === "theme1" ? "white" : "#f5f5f5",
        color: theme === "theme1" ? "rgb(201,197,197)" : "#333",
        transition: "all 0.3s ease-in-out",
      }}
    >
      {/* Controls Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          padding: "20px",
          background: theme === "theme1" ? "rgba(255, 255, 255, 0.9)" : "rgba(245, 245, 245, 0.9)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          zIndex: 1000,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "all 0.3s ease-in-out",
        }}
      >
        {/* Left Controls */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {/* Font Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ 
              fontWeight: "600", 
              color: theme === "theme1" ? "black" : "#333"
            }}>
              Font:
            </label>
            <select
              onChange={(e) => setSelectedFont(e.target.value)}
              value={selectedFont}
              className="font-select"
              style={{
                padding: "8px 12px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                fontFamily: selectedFont,
              }}
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ 
              fontWeight: "600", 
              color: theme === "theme1" ? "black" : "#333"
            }}>
              Speed:
            </label>
            <select
              onChange={(e) => setSpeed(Number(e.target.value))}
              value={speed}
              style={{
                padding: "8px 12px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <option value={2000}>0.25x</option>
              <option value={1500}>0.5x</option>
              <option value={1100}>0.75x</option>
              <option value={1000}>1.0x</option>
              <option value={700}>1.25x</option>
              <option value={500}>1.5x</option>
              <option value={300}>1.75x</option>
              <option value={100}>2.0x</option>
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ 
              fontWeight: "600", 
              color: theme === "theme1" ? "black" : "#333"
            }}>
              Words:
            </label>
            <select
              onChange={(e) => setNumWords(Number(e.target.value))}
              value={numWords}
              style={{
                padding: "8px 12px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {[3, 4, 5, 6, 7].map(num => (
                <option key={num} value={num}>{num} Words</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={startReading}
              disabled={isReading}
              style={{
                padding: "8px 16px",
                backgroundColor: isReading ? "#a8e6cf" : "#2ecc71",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: isReading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                transform: isReading ? "scale(0.95)" : "scale(1)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                fontWeight: "600",
                opacity: isReading ? 0.7 : 1,
              }}
            >
              Start
            </button>
            <button
              onClick={stopReading}
              disabled={!isReading}
              style={{
                padding: "8px 16px",
                backgroundColor: !isReading ? "#ffb8b8" : "#e74c3c",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: !isReading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                transform: !isReading ? "scale(0.95)" : "scale(1)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                fontWeight: "600",
                opacity: !isReading ? 0.7 : 1,
              }}
            >
              Stop
            </button>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {/* TTS Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ 
              fontWeight: "600", 
              color: theme === "theme1" ? "black" : "#333"
            }}>
              TTS:
            </label>
            <div
              onClick={toggleTTS}
              style={{
                width: "50px",
                height: "26px",
                backgroundColor: isTTSEnabled ? "#28a745" : "#dc3545",
                borderRadius: "13px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  backgroundColor: "white",
                  borderRadius: "11px",
                  position: "absolute",
                  top: "2px",
                  left: isTTSEnabled ? "26px" : "2px",
                  transition: "left 0.3s ease, box-shadow 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>

          {/* Theme Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ 
              fontWeight: "600", 
              color: theme === "theme1" ? "black" : "#333"
            }}>
              Theme:
            </label>
            <select
              onChange={(e) => setTheme(e.target.value as "theme1" | "theme2")}
              value={theme}
              style={{
                padding: "8px 12px",
                backgroundColor: "#333",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <option value="theme1">Theme 1</option>
              <option value="theme2">Theme 2</option>
            </select>
          </div>

          {/* Highlighter Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label style={{ 
              fontWeight: "600", 
              color: theme === "theme1" ? "black" : "#333"
            }}>
              Highlighter:
            </label>
            <div
              onClick={toggleHighlighter}
              style={{
                width: "50px",
                height: "26px",
                backgroundColor: isHighlighterOn ? "#28a745" : "#dc3545",
                borderRadius: "13px",
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.3s ease",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  backgroundColor: "white",
                  borderRadius: "11px",
                  position: "absolute",
                  top: "2px",
                  left: isHighlighterOn ? "26px" : "2px",
                  transition: "left 0.3s ease, box-shadow 0.3s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Text Display */}
      <div
        ref={textContainerRef}
        style={{
          width: "100%",
          height: "calc(100vh - 100px)",
          marginTop: "80px",
          padding: "0",
          overflow: "hidden",
          backgroundColor: theme === "theme1" ? "white" : "#f5f5f5",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          transition: "all 0.3s ease-in-out",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div style={{
          width: "100%",
          maxWidth: "800px",
          height: "100%",
          overflow: "auto",
          padding: "20px",
        }}>
          <p
            style={{
              fontSize: "18px",
              lineHeight: "1.8",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: "0",
              fontFamily: selectedFont,
              transition: "font-family 0.3s ease-in-out",
            }}
          >
            {words.map((word, index) => (
              <span
                ref={(el) => (wordElementsRef.current[index] = el)}
                key={index}
                onClick={() => handleWordClick(index)}
                onMouseEnter={(e) => handleMouseEnter(index, e)}
                onMouseLeave={handleMouseLeave}
                className={highlightedWords.has(index) ? 'highlighted-word' : ''}
                style={{
                  color:
                    highlightedWords.has(index)
                      ? "black"
                      : index >= currentIndex && index < currentIndex + numWords
                      ? theme === "theme1" ? "black" : "#007bff"
                      : theme === "theme1" ? "rgb(201,197,197)" : "#333",
                  fontWeight: highlightedWords.has(index) ? "bold" : "normal",
                  padding: "2px 1px",
                  margin: "0 2px",
                  borderRadius: "3px",
                  cursor: isHighlighterOn ? "pointer" : "default",
                  transition: "all 0.2s ease-in-out",
                  display: "inline-block",
                  transform: index >= currentIndex && index < currentIndex + numWords ? "scale(1.05)" : "scale(1)",
                }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* Word Meaning Dialog */}
      {selectedWord && dialogPosition && (
        <div
          className="word-meaning-dialog"
          onMouseEnter={handleDialogMouseEnter}
          onMouseLeave={handleDialogMouseLeave}
          style={{
            position: "fixed",
            top: dialogPosition.top - 80,
            left: dialogPosition.left,
            backgroundColor: theme === "theme1" ? "white" : "#f8f9fa",
            border: "none",
            borderRadius: "12px",
            padding: "16px 20px",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
            zIndex: 1000,
            maxWidth: "320px",
            animation: "dialogFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: "translateY(0)",
            backdropFilter: "blur(8px)",
            pointerEvents: "auto", // Ensure the dialog can receive mouse events
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              paddingBottom: "8px",
              borderBottom: "1px solid rgba(0,0,0,0.1)"
            }}>
              <strong style={{ 
                color: theme === "theme1" ? "#1a1a1a" : "#2d3436",
                fontSize: "18px",
                letterSpacing: "0.3px"
              }}>
                {selectedWord}
              </strong>
              <span style={{
                backgroundColor: theme === "theme1" ? "#e9ecef" : "#dee2e6",
                color: theme === "theme1" ? "#495057" : "#343a40",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500
              }}>
                noun
              </span>
            </div>
            
            <div style={{
              color: theme === "theme1" ? "#495057" : "#343a40",
              fontSize: "15px",
              lineHeight: "1.6",
              position: "relative",
              paddingLeft: wordMeaning ? "16px" : "0"
            }}>
              {wordMeaning ? (
                <>
                  <span style={{
                    position: "absolute",
                    left: "0",
                    top: "0",
                    color: theme === "theme1" ? "#868e96" : "#6c757d"
                  }}>•</span>
                  {wordMeaning}
                </>
              ) : (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#868e96"
                }}>
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  Fetching meaning
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes dialogFadeIn {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes loadingDots {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }

          .loading-dots {
            display: flex;
            gap: 4px;
          }

          .loading-dots span {
            width: 6px;
            height: 6px;
            background-color: #868e96;
            border-radius: 50%;
            display: inline-block;
            animation: loadingDots 1.4s infinite ease-in-out both;
          }

          .loading-dots span:nth-child(1) {
            animation-delay: -0.32s;
          }

          .loading-dots span:nth-child(2) {
            animation-delay: -0.16s;
          }

          /* Updated scrollbar styles */
          div::-webkit-scrollbar {
            width: 12px;
          }

          div::-webkit-scrollbar-track {
            background: ${theme === "theme1" ? "#f1f1f1" : "#ddd"};
            border-radius: 0;
          }

          div::-webkit-scrollbar-thumb {
            background: ${theme === "theme1" ? "#888" : "#666"};
            border-radius: 0;
            border: 3px solid ${theme === "theme1" ? "#f1f1f1" : "#ddd"};
          }

          div::-webkit-scrollbar-thumb:hover {
            background: ${theme === "theme1" ? "#555" : "#444"};
          }

          /* Font styles */
          .font-select {
            font-family: inherit;
          }

          .font-select option {
            font-family: inherit;
          }
        `}
      </style>
    </div>
  );
};

export default PDFViewer;