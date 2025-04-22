import { useState, useEffect } from 'react';
import { Container, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NameScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      navigate('/home');
    }
  }, [navigate]);

  const handleSubmit = () => {
    if (name.trim()) {
      localStorage.setItem('userName', name.trim());
      navigate('/home');
    } else {
      setError('Please enter your name.');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh', // full height
        backgroundImage: 'url("/green-wrinkled-paper.webp")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        paddingBottom: 'env(safe-area-inset-bottom)', // account for bottom system UI
      }}
    >
      <Container
        maxWidth="sm"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0)',
          padding: 3,
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Typography variant="h4" gutterBottom align="center" sx={{ color: 'text.primary' }}>
          What's Your Name?
        </Typography>

        <TextField
          fullWidth
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          variant="outlined"
          sx={{ backgroundColor: 'white', borderRadius: 1, mb: 2 }}
        />

        <Button
          variant="contained"
          size="large"
          sx={{ py: 3, width: '100%', px: 2 }}
          onClick={handleSubmit}
        >
          Done
        </Button>
      </Container>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: 50 }}
      >
        <Alert onClose={handleSnackbarClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
