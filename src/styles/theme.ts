// theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    // Optional: Customize colors if you want
    primary: {
      main: '#456C3B',
    },
    background: {
      default: '#f9f9f9',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
