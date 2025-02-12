import { useState } from "react";
import PDFViewer from "./components/PDFViewer";

function App() {
  const [pdfUrl, setPdfUrl] = useState("/sample.pdf"); // Use a default PDF URL

  return (
    <div className="h-screen bg-gray-800 text-white flex flex-col items-center justify-center">
      <h1 className="text-2xl mb-4">PDF Viewer</h1>

      <PDFViewer pdfUrl={pdfUrl} />

      {/* The file import button is removed here */}
    </div>
  );
}

export default App;
