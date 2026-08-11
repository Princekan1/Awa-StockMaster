import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { StockProvider } from './context/StockContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StockProvider>
      <App />
    </StockProvider>
  </StrictMode>,
)