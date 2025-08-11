/**
 * Application entry point.
 *
 * This file bootstraps the React application by rendering the main
 * `App` component into the HTML `#root` element. It also imports the
 * global Tailwind CSS build from `index.css`.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
import { store } from './store/store';

// Mount the React component tree inside the root element
createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
