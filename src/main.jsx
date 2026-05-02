import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // ОСЬ ЦЕЙ РЯДОК МАГІЧНИЙ - ВІН ВМИКАЄ СТИЛІ!

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)