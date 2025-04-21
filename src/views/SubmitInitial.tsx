import React, { useEffect, useState } from 'react';
import {
  Typography,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Slide,
  Box,
  Stack,
  Snackbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Alert,
  Skeleton,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { TransitionProps } from '@mui/material/transitions';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import SearchComponent from '../components/SearchComponent';

const API_URL = import.meta.env.VITE_API_URL;

interface SongSelection {
  name: string;
  artist: string;
  album: string;
  imageUrl: string;
  previewUrl: string;
  spotifyUrl: string;
}

const Transition = (props: TransitionProps & { children: React.ReactElement }) => (
  <Slide direction="up" {...props} />
);

const LOCAL_STORAGE_KEY = 'submittedSongs';

export default function SubmitInitial() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'success' | 'warning' | 'info'>('error');
  const [selectedSongs, setSelectedSongs] = useState<(SongSelection | null)[]>([null, null, null, null, null]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // <-- Add loading state
  const navigate = useNavigate(); // <-- Create the navigate instance
  const [submitting, setSubmitting] = useState(false);

  const userId = localStorage.getItem('userName');

  useEffect(() => {
    const fetchSubmittedSongs = async () => {
      if (!userId) return;

      try {
        setIsLoading(true); // Start loading
        // TODO: Update to use axios
        const res = await fetch(`${API_URL}/api/nominated-songs?user=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch initial songs.');
        const data = await res.json();

        if (Array.isArray(data.songs)) {
          const filled = new Array(5).fill(null).map((_, i) => data.songs[i] || null);
          setSelectedSongs(filled);
        }
      } catch (err) {
        console.error('Failed to load submitted songs:', err);
      } finally {
        setIsLoading(false); // End loading
      }
    };

    fetchSubmittedSongs();
  }, [userId]);

  const handleOpenSearchDialog = (index: number) => {
    setSelectedIndex(index);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedIndex(null);
  };

  const handleSongSelect = (song: SongSelection) => {
    if (selectedIndex === null) return;

    const isDuplicate = selectedSongs.some((s, idx) =>
      idx !== selectedIndex && s?.spotifyUrl === song.spotifyUrl
    );

    if (isDuplicate) {
      setErrorMessage('You’ve already added this song');
      setAlertSeverity('error'); // Set severity dynamically
      setShowSnackbar(true);
      return;
    }

    const updatedSongs = [...selectedSongs];
    updatedSongs[selectedIndex] = song;
    setSelectedSongs(updatedSongs);
    handleClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true); // Start spinner

    try {
      await new Promise((resolve) => setTimeout(resolve, 200)); // Keep spinner for 200ms minimum

      const validSongs = selectedSongs.filter(Boolean) as SongSelection[];

      if (validSongs.length < 5) {
        setErrorMessage('Please submit 5 songs');
        setAlertSeverity('error');
        setShowSnackbar(true);
        return;
      }

      const userName = localStorage.getItem('userName');
      //TODO: update to use axios
      const res = await fetch(`${API_URL}/api/submit-initial`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userName, songs: validSongs }),
      });

      const data = await res.json();

      if (res.status === 409 && data.duplicates) {
        const duplicateUrls = data.duplicates.map((s: SongSelection) => s.spotifyUrl);
        const updatedSongs = selectedSongs.map((s) =>
          s && duplicateUrls.includes(s.spotifyUrl) ? null : s
        );

        const duplicateNames = data.duplicates.map((s: SongSelection) => `${s.name} by ${s.artist}`);
        const isPlural = duplicateNames.length > 1;
        setErrorMessage(
          `The following song${isPlural ? 's have' : ' has'} already been submitted: ${duplicateNames.join(', ')}. Please add different song${isPlural ? 's' : ''}.`
        );

        setAlertSeverity('error');
        setShowSnackbar(true);
        setSelectedSongs(updatedSongs);
        return;
      }

      if (res.status === 200) {
        setErrorMessage(data.message || 'Songs submitted successfully!');
        setAlertSeverity('success');
        setShowSnackbar(true);

        window.dispatchEvent(new Event('songsUpdated'));
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } else {
        setErrorMessage(data.message || 'Submission failed');
        setAlertSeverity('error');
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage('Something went wrong. Please try again later.');
      setAlertSeverity('error');
      setShowSnackbar(true);
    } finally {
      setSubmitting(false); // End spinner
    }
  };

  return (
    <>
      {/* Scrollable Main Content Area */}
      <Box
        sx={{
          pb: 8,
          overflowY: 'auto',
          height: '100vh',
          backgroundImage: 'url("/wrinkled-paper-texture.jpg")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          px: 2,
        }}
      >
        {/* Top App Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 0,
            height: 64,
          }}
        >
          <IconButton onClick={() => navigate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <Box sx={{ pt: 2, pb: 2, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'text.primary' }}>
            Pick Your Top 5 Tracks from 2000 to 2025
          </Typography>
        </Box>

        <Stack spacing={2}>
          <List disablePadding>
            {isLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                {/* Skeleton loader for each card */}
                {new Array(5).fill(null).map((_, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: 'background.paper',
                      color: 'text.primary',
                      borderRadius: 2,
                      border: '1px solid #ddd',
                      mb: 1,
                      px: 2,
                      py: 1.5,
                      cursor: 'pointer',
                    }}
                  >
                    <Skeleton
                      variant="rectangular"
                      width={56}
                      height={56}
                      sx={{ borderRadius: 1 }}
                    />
                    <ListItemText
                      primary={<Skeleton width="50%" />}
                      secondary={<Skeleton width="60%" />}
                      sx={{ ml: 2 }}
                    />
                  </ListItem>
                ))}
              </Box>
            ) : (
              selectedSongs.map((song, index) => (
                <ListItem
                  key={song?.spotifyUrl || index}
                  onClick={() => handleOpenSearchDialog(index)}
                  sx={{
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderRadius: 2,
                    border: '1px solid #ddd',
                    mb: 1,
                    px: 2,
                    py: 1.5,
                    cursor: 'pointer',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={song?.imageUrl}
                      alt={song?.name}
                      variant="square"
                      sx={{ width: 56, height: 56, borderRadius: 1 }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={song ? song.name : `Select Song ${index + 1}`}
                    secondary={song ? song.artist : 'Tap to search and add a song'}
                    primaryTypographyProps={{ fontWeight: song ? 500 : 400 }}
                    sx={{ ml: 2 }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </Stack>
      </Box>

      {/* Bottom Submit Bar (Fixed) */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          boxShadow: '0 -4px 8px rgba(0,0,0,0.1)',
          p: 3,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          size="large"
          sx={{ py: 2, width: '100%', px: 2 }}
          color="primary"
          fullWidth
          disabled={selectedSongs.filter(Boolean).length !== 5 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <CircularProgress size={24} sx={{ color: 'white', mr: 2 }} /> {/* Spinner */}
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
        <Typography
          variant="body2"
          sx={{
            pt: 2,
            color: 'grey.600', // Use Material-UI's grey color for caption text
            textAlign: 'center',
          }}
        >
          Note: You can come back to this screen to update your song choices anytime before voting opens.
        </Typography>
      </Box>

      {/* Search Dialog */}
      <Dialog
        fullScreen={useMediaQuery(useTheme().breakpoints.down('sm'))}
        open={open}
        onClose={handleClose}
        slots={{ transition: Transition }}
      >
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Add a Song
            </Typography>
          </Toolbar>
        </AppBar>
        <Box sx={{ p: 3 }}>
          <SearchComponent onSelect={handleSongSelect} />
        </Box>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={8000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity={alertSeverity} sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
