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
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { TransitionProps } from '@mui/material/transitions';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useNavigate } from 'react-router-dom';
import SearchComponent from '../components/SearchComponent';

const API_URL = import.meta.env.VITE_API_URL;
const LOCAL_STORAGE_KEY = 'submittedSongs';

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

export default function SubmitInitial() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<'error' | 'success' | 'warning' | 'info'>('error');
  const [selectedSongs, setSelectedSongs] = useState<(SongSelection | null)[]>([null, null, null, null, null]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasPreviouslySubmitted, setHasPreviouslySubmitted] = useState(false);

  const navigate = useNavigate();
  const userId = localStorage.getItem('userName');

  useEffect(() => {
    const fetchSubmittedSongs = async () => {
      if (!userId) return;

      try {
        setIsLoading(true);
        const res = await fetch(`${API_URL}/api/nominated-songs?user=${userId}`);
        if (!res.ok) throw new Error('Failed to fetch initial songs.');
        const data = await res.json();

        if (Array.isArray(data.songs)) {
          const filled = new Array(5).fill(null).map((_, i) => data.songs[i] || null);
          setSelectedSongs(filled);
          setHasPreviouslySubmitted(data.songs.length > 0); // Set if songs are already submitted
        }
      } catch (err) {
        console.error('Failed to load submitted songs:', err);
      } finally {
        setIsLoading(false);
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
    setSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const validSongs = selectedSongs.filter(Boolean) as SongSelection[];

      if (validSongs.length < 5) {
        setErrorMessage('Please submit 5 songs');
        setAlertSeverity('error');
        setShowSnackbar(true);
        return;
      }

      const userName = localStorage.getItem('userName');
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
        // Change message based on whether it's an update or a submit
        const successMessage = hasPreviouslySubmitted
          ? 'Your songs have been updated successfully!'
          : 'Songs submitted successfully!';

        setErrorMessage(successMessage);
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
      setSubmitting(false);
    }
  };


  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100vw',
          backgroundImage: 'url("/white-wrinkled-paper.webp")',
          backgroundRepeat: 'repeat',
          backgroundSize: 'cover',
          zIndex: -1,
        }}
      />
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          overflowY: 'auto',
          pb: 1,
        }}
      >
        <Box
          component="img"
          src="/nomination-screen-overlays.webp"
          sx={{
            position: 'fixed',
            top: (theme) => `calc(${theme.spacing(0)} - ${theme.spacing(7)})`,
            [useTheme().breakpoints.up('md')]: {
              top: `calc(${useTheme().spacing(0)} - ${useTheme().spacing(24)})`,
            },
            left: '50%',
            transform: `translateX(calc(-60%)) scale(2.1)`,
            transformOrigin: 'top center',
            zIndex: 1,
            width: '100%',
            maxWidth: 800,
            pointerEvents: 'none',
          }}
        />
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
          <IconButton onClick={() => navigate(-1)} sx={{ color: '#000', px: 2, scale: 1 }}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Box sx={{ height: 64 }} />
        <Stack>
          <Box
            component="img"
            src="/nomination-screen-heading.webp"
            sx={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              width: '90%',
              maxWidth: 600,
              height: 'auto',
              pb: 2,
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <List disablePadding sx={{ width: '90%', maxWidth: 900, px: 2, boxSizing: 'border-box' }}>
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
                        opacity: isLoading ? 1 : 0,
                        transition: 'opacity 0.3s ease-out',
                      }}
                    >
                      <Skeleton variant="rectangular" width={56} height={56} sx={{ borderRadius: 1, transition: 'opacity 0.3s ease-out' }} />
                      <ListItemText
                        primary={<Skeleton width="50%" sx={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease-out' }} />}
                        secondary={<Skeleton width="60%" sx={{ opacity: isLoading ? 1 : 0, transition: 'opacity 0.3s ease-out' }} />}
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
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          boxShadow: '0 -4px 8px rgba(0,0,0,0.1)',
          px: 5,
          py: 2,
          zIndex: 1000,
        }}
      >
        <Button
          variant="contained"
          size="large"
          sx={{ py: 2, width: '100%', px: 2 }}
          color="primary"
          fullWidth
          disabled={submitting || selectedSongs.filter(Boolean).length !== 5}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <CircularProgress size={24} sx={{ color: 'white', mr: 2 }} />
              {hasPreviouslySubmitted ? 'Updating...' : 'Submitting...'}
            </>
          ) : selectedSongs.every((song) => song !== null) ? (
            hasPreviouslySubmitted ? 'Update' : 'Submit'
          ) : (
            'Submit'
          )}
        </Button>

      </Box>
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
