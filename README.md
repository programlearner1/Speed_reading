# Speed Reading App

## 🚀 Overview
The **Speed Reading App** is a React-based web application designed to help users improve their reading speed. It features customizable reading speeds, PDF import, font adjustments, and a moving highlight box to guide reading.

## 🛠 Features
- 📖 **Adjustable Speed**: Control the number of words displayed per minute.
- 📂 **Import PDFs**: Load documents directly from local storage.
- 🎨 **Customizable Font**: Change the font to enhance readability.
- 🔦 **Word Highlighting**: Automatically highlights words to guide reading.
- 📜 **Moving Highlight Box**: Moves at a set pace to help track progress.

## 🏗 Tech Stack
- **Frontend**: React, Tailwind CSS, Vite
- **State Management**: React Context API
- **Styling**: Tailwind CSS
- **File Handling**: PDF.js (for PDF processing)

## 📦 Installation
### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/your-username/speed-reading-app.git
cd speed-reading-app
```

### **2️⃣ Install Dependencies**
```bash
npm install
```

### **3️⃣ Start the Development Server**
```bash
npm run dev
```

## ⚙️ Configuration
Make sure your project includes the following files:

### `tailwind.config.js`
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### `postcss.config.js`
```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
    autoprefixer: {},
  },
};
```

## 📁 Project Structure
```
📦 speed-reading-app
├── 📂 src
│   ├── 📂 components      # UI Components
│   ├── 📂 pages           # App Pages
│   ├── 📂 utils           # Helper Functions
│   ├── 📂 styles          # Global Styles
│   ├── App.jsx            # Main App Component
│   ├── main.jsx           # Entry Point
│   └── index.css          # Global CSS
├── tailwind.config.js      # Tailwind Configuration
├── postcss.config.js       # PostCSS Configuration
├── vite.config.js          # Vite Configuration
├── package.json            # Dependencies & Scripts
└── README.md               # Project Documentation
```

## 🛠 Troubleshooting
If you encounter issues with **Tailwind CSS or PostCSS**, ensure:
- `@tailwindcss/postcss` is installed.
- Your `postcss.config.js` is set up correctly.
- Clear cache and reinstall dependencies:
  ```bash
  rm -rf node_modules package-lock.json
  npm cache clean --force
  npm install
  ```

## 📜 License
This project is licensed under the **MIT License**.

---

**💡 Contributors & Feedback**
Feel free to submit pull requests or report issues to improve the project! 🚀

