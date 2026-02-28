import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from "@/components/shared/ErrorBoundary"
import { getTheme } from "@/lib/theme"

// Prevent flash of wrong theme
const initialTheme = getTheme();
document.documentElement.classList.add(initialTheme);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
