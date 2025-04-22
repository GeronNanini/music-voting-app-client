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

  const normalizeString = (str: string) =>
    str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/gi, '');

  const handleSongSelect = (song: SongSelection) => {
    if (selectedIndex === null) return;

    const newSongName = normalizeString(song.name);
    const newSongArtist = normalizeString(song.artist);

    const isDuplicate = selectedSongs.some((s, idx) => {
      if (idx === selectedIndex || !s) return false;

      const existingName = normalizeString(s.name);
      const existingArtist = normalizeString(s.artist);

      return existingName === newSongName && existingArtist === newSongArtist;
    });

    if (isDuplicate) {
      setErrorMessage('This song already exists in your list.');
      setAlertSeverity('error');
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
      {/* Fixed Background Wrapper */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100vw',
          backgroundImage: 'url("/white-wrinkled-paper.png")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          zIndex: -1,
        }}
      />

      {/* Scrollable Content Area */}
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          overflowY: 'auto',
          pb: 12, // Padding for bottom bar
        }}
      >

        <Box
          component="img"
          src="/nomination-screen-overlays.png"
          sx={{
            position: 'fixed',
            top: (theme) => theme.spacing(3),
            left: '50%',
            transform: (theme) => `translateX(calc(-55% + ${theme.spacing(0.25)})) scale(1.5)`,
            transformOrigin: 'top center',
            zIndex: 10,
            width: '100%',
            maxWidth: 600,
          }}
        />



        {/* Top App Bar */}
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            px: 0,
            bgcolor: 'transparent',
            zIndex: 100,
          }}
        >
          <IconButton onClick={() => navigate(-1)}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        {/* Spacer for the fixed top bar */}
        <Box sx={{ height: 64 }} />


        {/* Scrollable Song Selection List */}
        <Stack>
  {/* Main Heading Image at the Top with Highest Z-Index */}
  <Box
  component="img"
  src="/nomination-screen-heading.png"
  sx={{
    display: 'block', // Ensures it's a block element to apply margin
    marginLeft: 'auto', // Center the image horizontally
    marginRight: 'auto', // Center the image horizontally
    width: '90vw', // Set width to 90% of the viewport width
    maxWidth: '100%', // Ensure the image does not exceed its natural width
    pb: 2
  }}
/>
  <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
    <List disablePadding sx={{ width: '100%', maxWidth: 900, px: 2, boxSizing: 'border-box' }}>
      {isLoading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
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
              <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 1 }} />
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
  </Box>
</Stack>




      </Box>

      {/* Fixed Submit Button Bar */}
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
              <CircularProgress size={24} sx={{ color: 'white', mr: 2 }} />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
        {/* <Typography
          variant="body2"
          sx={{
            pt: 2,
            color: 'grey.600',
            textAlign: 'center',
          }}
        >
          Note: You can come back to this screen to update your song choices anytime before voting opens.
        </Typography> */}
      </Box>

      {/* Search Dialog */}
      <Dialog
        fullScreen={useMediaQuery(useTheme().breakpoints.down('sm'))}
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
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

        <Box sx={{ px: 2, pt: 2 }}>
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
