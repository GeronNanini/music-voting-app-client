import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import RankDialog from '../components/RankDialog';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_VOTES = 10;

export default function Vote() {
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
  const [user, setUser] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUser(storedName);
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    // TODO: Update to use axios
    fetch(`${API_URL}/api/aggregated-songs`)
      .then((res) => res.json())
      .then((data) => {
        console.log('API Data:', data);
        setAllSongs(data.songs || []);
        setLoading(false); // ✅ Stop loading when data is fetched
      })
      .catch((err) => {
        console.error('API error:', err);
        setError('Failed to load songs');
        setLoading(false); // ✅ Stop loading even if there's an error
      });
  }, []);

  const handleAddSong = (song: any) => {
    if (
      selectedSongs.length < MAX_VOTES &&
      !selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)
    ) {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleRemoveSong = (song: any) => {
    const newSelectedSongs = selectedSongs.filter((s) => s.spotifyUrl !== song.spotifyUrl);
    setSelectedSongs(newSelectedSongs);
  };

  const handleSubmit = async () => {
    setError(null);
    setSubmitted(false);

    if (!user) {
      setError('User name not found.');
      return;
    }

    if (selectedSongs.length === 0) {
      setError('Please select at least one song.');
      return;
    }

    // TODO: Update to use axios
    const res = await fetch(`${API_URL}/api/submit-final`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, songs: selectedSongs }),
    });

    const data = await res.json();

    if (res.ok) {
      setSubmitted(true);
    } else {
      setError(data.message || 'Error submitting vote.');
    }
  };

  return (
    <Box sx={{ width: '100vw', minHeight: '100vh', backgroundColor: '#fff' }}>
      {loading ? (
        <Box
          sx={{
            width: '100%',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#fff',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1000,
              backgroundColor: '#fff',
              borderBottom: '1px solid #ccc',
              px: 0,
              py: 2,
            }}
          >
            <Container maxWidth="sm">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'normal',
                }}
              >
                <IconButton onClick={() => navigate(-1)}>
                  <ChevronLeftIcon />
                </IconButton>
                <Typography variant="h6" component="div" sx={{ color: 'black' }}>
                  Add 10 songs to your shortlist
                </Typography>
              </Box>
            </Container>
          </Box>

          <Container maxWidth={false} sx={{ pb: 12, backgroundColor: '#fff' }}>
            <RankDialog
              open={rankDialogOpen}
              onClose={() => setRankDialogOpen(false)}
              songs={selectedSongs}
              onUpdateSongs={setSelectedSongs}
            />

            <List sx={{ mb: 2, width: '100%' }}>
              {allSongs.map((song: any) => (
                <ListItem
                  key={song.spotifyUrl}
                  sx={{
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    width: '100%',
                    px: 1,
                    backgroundColor: 'background.paper',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={song.imageUrl}
                        alt={`${song.name} album cover`}
                        variant="square"
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={song.name}
                      secondary={`${song.artist} • ${song.album}`}
                      sx={{
                        ml: 0,
                        mr: 2,
                        whiteSpace: 'normal',
                        wordWrap: 'break-word',
                        width: 'calc(100% - 80px)',
                        color: 'black',
                      }}
                    />
                  </Box>

                  <Button
                    variant="contained"
                    onClick={() =>
                      selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)
                        ? handleRemoveSong(song)
                        : handleAddSong(song)
                    }
                    disabled={
                      selectedSongs.length >= MAX_VOTES &&
                      !selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)
                    }
                    color={
                      selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)
                        ? 'error'
                        : 'primary'
                    }
                    sx={{ minWidth: '100px', marginLeft: 'auto', marginTop: '10px' }}
                  >
                    {selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)
                      ? 'Remove'
                      : 'Add'}
                  </Button>
                </ListItem>
              ))}
            </List>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={selectedSongs.length === 0}
              sx={{ bgcolor: 'primary.main' }}
            >
              Submit Vote
            </Button>

            {submitted && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Vote submitted successfully!
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </Container>

          {/* Footer */}
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '100%',
              bgcolor: 'white',
              borderTop: '1px solid #ccc',
              py: 2,
              px: 2,
              zIndex: 1000,
              boxSizing: 'border-box',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                width: '100%',
                maxWidth: '100%',
                margin: '0 auto',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  color: 'black',
                  fontWeight: 'normal',
                  fontSize: '0.875rem',
                  whiteSpace: 'normal',
                  flex: 1,
                }}
              >
                {selectedSongs.length} / {MAX_VOTES} songs selected
              </Box>

              <Button
                variant="contained"
                onClick={() => setRankDialogOpen(true)}
                disabled={selectedSongs.length === 0}
                sx={{
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                  borderRadius: '12px',
                  backgroundColor: 'primary.main',
                }}
              >
                View Shortlist
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
