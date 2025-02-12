import { useState } from "react";
import PDFViewer from "../components/PDFViewer";

interface ReaderProps {
  isResultPage?: boolean;  // Optional prop
}

const Reader: React.FC<ReaderProps> = ({ isResultPage = false }) => {
  const [file, setFile] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(URL.createObjectURL(uploadedFile));
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Reading Mode</h2>

      {/* Conditionally render file input based on isResultPage and if a file has been uploaded */}
      {!file && !isResultPage && (
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileUpload}
          className="mb-4 p-2 bg-gray-700 text-white rounded"
        />
      )}

      {/* Display PDF viewer if a file is selected */}
      {file && <PDFViewer file={file} />}
    </div>
  );
};

export default Reader;
