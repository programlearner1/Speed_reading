import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Reader from "./pages/Reader"; // Reader component handles both cases
import Settings from "./pages/Settings";
import { SpeedProvider } from "./context/speedcontext";
import "./styles/global.css";

const App = () => {
  return (
    <SpeedProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reader" element={<Reader isResultPage={false} />} />  {/* Handle Reader with file input */}
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </SpeedProvider>
  );
};

export default App;
