import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from './styles/theme'; // Import your custom theme
import NameScreen from './views/NameScreen';
import Home from './views/Home';
import SubmitInitial from './views/SubmitInitial';
import Vote from './views/Vote';
import ProtectedRoute from './views/ProtectedRoute';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<NameScreen />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-initial"
            element={
              <ProtectedRoute>
                <SubmitInitial />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vote"
            element={
              <ProtectedRoute>
                <Vote />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
