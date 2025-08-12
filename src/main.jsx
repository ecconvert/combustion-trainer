/**
 * Application entry point.
 *
 * This file bootstraps the React application by rendering the main
 * `App` component into the HTML `#root` element. It also imports the
 * global Tailwind CSS build from `index.css`.
 */
import { UIStateProvider } from './components/UIStateContext'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mount the React component tree inside the root element
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UIStateProvider>
      <App />
    </UIStateProvider>
  </StrictMode>,
)
