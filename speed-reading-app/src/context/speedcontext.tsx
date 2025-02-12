import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the context value type
interface SpeedContextType {
  speed: number;
  setSpeed: React.Dispatch<React.SetStateAction<number>>;
  wordsPerFrame: number;
  setWordsPerFrame: React.Dispatch<React.SetStateAction<number>>;
}

// Create the context
const SpeedContext = createContext<SpeedContextType | null>(null);

export const SpeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [speed, setSpeed] = useState<number>(1);
  const [wordsPerFrame, setWordsPerFrame] = useState<number>(5);

  return (
    <SpeedContext.Provider value={{ speed, setSpeed, wordsPerFrame, setWordsPerFrame }}>
      {children}
    </SpeedContext.Provider>
  );
};

export const useSpeed = (): SpeedContextType => {
  const context = useContext(SpeedContext);
  if (!context) {
    throw new Error("useSpeed must be used within a SpeedProvider");
  }
  return context;
};
