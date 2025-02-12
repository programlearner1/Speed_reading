import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const SpeedReader = ({ text, wordsPerMinute }) => {
  const words = text.split(" ");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  // Font and Color Customization State
  const [fontSize, setFontSize] = useState(20);
  const [fontColor, setFontColor] = useState("#ffffff");
  const [highlightColor, setHighlightColor] = useState("#808080");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev < words.length - 1 ? prev + 1 : prev));
    }, (60 / wordsPerMinute) * 1000);

    return () => clearInterval(interval);
  }, [wordsPerMinute, words.length]);

  return (
    <div className="relative w-full h-64 overflow-auto bg-gray-900 p-4 text-gray-400">
      {/* Controls for Font and Color */}
      <div className="flex space-x-4 mb-4">
        <label>
          Font Size:
          <input
            type="number"
            value={fontSize}
            min={10}
            max={50}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="ml-2 p-1 rounded"
          />
        </label>

        <label>
          Font Color:
          <input
            type="color"
            value={fontColor}
            onChange={(e) => setFontColor(e.target.value)}
            className="ml-2 p-1 rounded"
          />
        </label>

        <label>
          Highlight Color:
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="ml-2 p-1 rounded"
          />
        </label>
      </div>

      {/* Highlighted Word */}
      <motion.div
        className="absolute p-1 rounded-lg"
        style={{ backgroundColor: highlightColor }}
        initial={{ opacity: 0.7 }}
        animate={{ y: currentWordIndex * 24 }}
        transition={{ ease: "linear", duration: 0.2 }}
      >
        <span className="font-bold" style={{ color: fontColor }}>
          {words[currentWordIndex]}
        </span>
      </motion.div>

      {/* Full Text */}
      <p className="text-lg leading-6" style={{ fontSize: `${fontSize}px`, color: fontColor }}>
        {words.map((word, index) => (
          <span key={index} className={index === currentWordIndex ? "font-bold" : ""}>
            {word + " "}
          </span>
        ))}
      </p>
    </div>
  );
};

export default SpeedReader;
