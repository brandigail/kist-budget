import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ensureDemoData } from './db/seedDemo.ts'
import { MonthProvider } from './providers/MonthProvider.tsx'
import { ThemeProvider } from './providers/ThemeProvider.tsx'

// First launch shows a lived-in demo household; the live queries pick it up as soon as it is written.
void ensureDemoData()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <MonthProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MonthProvider>
    </ThemeProvider>
  </StrictMode>,
)
