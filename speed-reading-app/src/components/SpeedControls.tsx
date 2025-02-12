import React from "react";

interface SpeedControlsProps {
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  wordsPerFrame: number;
  setWordsPerFrame: React.Dispatch<React.SetStateAction<number>>;
}

const SpeedControls: React.FC<SpeedControlsProps> = ({ speed, setSpeed, wordsPerFrame, setWordsPerFrame }) => {
  return (
    <div className="mt-4">
      <label>
        Speed:
        <input 
          type="number" 
          value={speed} 
          onChange={(e) => setSpeed(parseFloat(e.target.value))} 
          min={0.2} max={2} step={0.1} 
          className="ml-2 p-1 rounded"
        />
      </label>

      <label className="ml-4">
        Words Per Frame:
        <input 
          type="number" 
          value={wordsPerFrame} 
          onChange={(e) => setWordsPerFrame(parseInt(e.target.value))} 
          min={1} max={10} 
          className="ml-2 p-1 rounded"
        />
      </label>
    </div>
  );
};

export default SpeedControls;
