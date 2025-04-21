import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles'; // ✅ Import ThemeProvider
import './index.css';
import App from './App.tsx';
import lightTheme from './styles/theme'; // ✅ Your custom theme

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={lightTheme}>
      <App />
    </ThemeProvider>
  </StrictMode>
);
