import React, { useState, useEffect, useRef } from "react";
import { getDocument } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

interface PDFViewerProps {
  file: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const [speed, setSpeed] = useState<number>(1000); // Speed in milliseconds
  const [numWords, setNumWords] = useState<number>(3); // Words per highlight
  const [words, setWords] = useState<string[]>([]); // Extracted words
  const [currentIndex, setCurrentIndex] = useState<number>(0); // Current reading position
  const [isReading, setIsReading] = useState<boolean>(false); // Controls start/stop
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null); // Stores interval reference

  // Reference to the text container for scrolling
  const textContainerRef = useRef<HTMLDivElement | null>(null);
  const wordElementsRef = useRef<(HTMLSpanElement | null)[]>([]); // To store references to word elements

  // Dropdown styles
  const dropdownStyles = {
    padding: "5px 10px",
    backgroundColor: "#333",
    color: "#fff",
    borderRadius: "5px",
    border: "none",
  };

  // Button styles
  const buttonStyles = {
    padding: "8px 16px",
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  };

  // Label styles for Speed and Words (Bold and Black)
  const labelStyles = {
    fontWeight: "bold" as const,
    color: "black" as const,
  };

  useEffect(() => {
    if (!file) return;

    const extractText = async () => {
      try {
        const loadingTask = getDocument(file);
        const pdf = await loadingTask.promise;
        let extractedText = "";

        // Extract text from each page of the PDF
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
  };

  // Function to stop reading
  const stopReading = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setIsReading(false);
  };

  // Restart the reading process when speed changes (if already reading)
  useEffect(() => {
    if (isReading) {
      startReading();
    }
  }, [speed, numWords]); // Restart when speed or number of words changes

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

        // Calculate the distance to scroll
        const distanceToScroll = wordCenterY - containerCenterY;

        // Easing function for smooth scrolling
        const easeInOutQuad = (t: number) => {
          if (t < 0.5) return 2 * t * t;
          return -1 + (4 - 2 * t) * t;
        };

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

  useEffect(() => {
    if (currentIndex < words.length) {
      smoothScrollToWord();
    }
  }, [currentIndex, words.length]);

  return (
    <div
      style={{
        position: "relative",
        height: "100vh",
        padding: "20px",
        backgroundColor: "white",
        color: "rgb(201,197,197)",
      }}
    >
      {/* Controls (Speed, Words, Start/Stop) */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "20px",
          zIndex: 10,
          display: "flex", // Flexbox to align buttons in a row
          flexDirection: "row", // Ensure the buttons are aligned horizontally
          gap: "10px", // Adds space between the buttons
        }}
      >
        <div>
          <label style={{ ...labelStyles, marginRight: "10px" }}>Speed:</label>
          <select onChange={(e) => setSpeed(Number(e.target.value))} value={speed} style={dropdownStyles}>
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
          <label style={{ ...labelStyles, marginRight: "10px" }}>Words:</label>
          <select onChange={(e) => setNumWords(Number(e.target.value))} value={numWords} style={dropdownStyles}>
            <option value={3}>3 Words</option>
            <option value={4}>4 Words</option>
            <option value={5}>5 Words</option>
            <option value={6}>6 Words</option>
            <option value={7}>7 Words</option>
          </select>
        </div>

        {/* Start & Stop Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={startReading} disabled={isReading} style={buttonStyles}>
            Start
          </button>
          <button onClick={stopReading} disabled={!isReading} style={buttonStyles}>
            Stop
          </button>
        </div>
      </div>

      {/* Text Display with Highlighting */}
      <div
        ref={textContainerRef}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          marginTop: "40px",
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
              ref={(el) => (wordElementsRef.current[index] = el)} // Store references to each word
              key={index}
              style={{
                color: index >= currentIndex && index < currentIndex + numWords ? "black" : "rgb(201,197,197)",
                transition: "color 0.3s ease-in-out",
                marginRight: "5px",
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
