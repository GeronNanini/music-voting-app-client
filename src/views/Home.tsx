import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Typography,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';

import RankDialog from '../components/RankDialog'; // adjust the path as needed

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const navigate = useNavigate();

  const [songCount, setSongCount] = useState<number | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hasVotedFinal, setHasVotedFinal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingContent, setLoadingContent] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [finalSongs, setFinalSongs] = useState<any[]>([]);

  const [loadingSongs, setLoadingSongs] = useState(false);




  const fetchSongCount = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/aggregated-songs`);
      setSongCount(res.data.songs.length);
    } catch (err) {
      console.error('Failed to fetch aggregated songs:', err);
    }
  }, []);

  const checkFinalVote = async (userName: string) => {
    try {
      const voteDoc = await axios.get(`${API_URL}/api/final-vote?user=${userName}`);
      if (Array.isArray(voteDoc.data.songs) && voteDoc.data.songs.length > 0) {
        setHasVotedFinal(true);
      }
    } catch (err) {
      console.error('Error checking final vote:', err);
    }
  };

  useEffect(() => {
    const userName = localStorage.getItem('userName');
    if (!userName) {
      navigate('/name');
      return;
    }

    const loadData = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/nominated-songs?user=${userName}`);
        if (Array.isArray(res.data.songs) && res.data.songs.length > 0) {
          setHasSubmitted(true);
        }

        await fetchSongCount();
        await checkFinalVote(userName);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
        setLoadingContent(false);
      }
    };

    loadData();

    window.addEventListener('songsUpdated', fetchSongCount);
    return () => window.removeEventListener('songsUpdated', fetchSongCount);
  }, [navigate, fetchSongCount]);

  useEffect(() => {
    if (!loadingContent) {
      window.scrollTo(0, 0); // Scroll to top after content loads
    }
  }, [loadingContent]);

  const handleViewVotesClick = async () => {
    const user = localStorage.getItem('userName');
    if (!user) return;

    setLoadingSongs(true);
    try {
      const res = await axios.get(`${API_URL}/api/final-vote?user=${user}`);
      if (Array.isArray(res.data.songs)) {
        setFinalSongs(res.data.songs);
        setRankDialogOpen(true);
      }
    } catch (err) {
      console.error('Error loading final vote songs:', err);
    } finally {
      setLoadingSongs(false);
    }
  };

  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        backgroundImage: 'url("/home-bg-alt.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
      }}
    >
      <Stack
        spacing={4}
        alignItems="center"
        justifyContent="center"
        sx={{
          width: '100%',
          maxWidth: 600,
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0)',
        }}
      >
        <img
          src="/home-heading.svg"
          alt="Hottest 100 Heading"
          style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
        />

        {loading ? (
          <Stack spacing={2} alignItems="center">
            <CircularProgress />
            <Typography variant="body1">Loading...</Typography>
          </Stack>
        ) : (
          <>
            {songCount !== null && (
              <Typography variant="body1" sx={{ color: 'text.primary' }}>
                There {songCount === 1 ? 'is' : 'are'} currently {songCount}/110 song
                {songCount !== 1 ? 's' : ''} in the pool.
              </Typography>
            )}

            <Box
              sx={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundImage: 'url("/button-background.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                padding: 2,
                borderRadius: 2,
              }}
            >
              <Stack spacing={2} width="100%" alignItems="center">
                <Button
                  variant="contained"
                  size="large"
                  sx={{ py: 3, width: '90%', px: 2 }}
                  onClick={() => navigate('/submit-initial')}
                >
                  {hasSubmitted ? '✏️ Update my songs' : '🎧 Nominate Songs'}
                </Button>

                <Button
                  variant="contained"
                  size="large"
                  color="primary"
                  fullWidth
                  sx={{ py: 3, width: '90%', px: 2 }}
                  onClick={hasVotedFinal ? handleViewVotesClick : () => navigate('/vote')}
                  disabled={loadingSongs}
                >

                  {loadingSongs ? (
                    <>
                      <CircularProgress size={24} sx={{ color: 'white', mr: 2 }} />
                      Loading...
                    </>
                  ) : hasVotedFinal ? (
                    '👀 View my votes'
                  ) : (
                    '📝 Vote'
                  )}
                </Button>



              </Stack>
            </Box>

          </>
        )}

        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          aria-labelledby="vote-locked-dialog-title"
          aria-describedby="vote-locked-dialog-description"
        >
          <DialogTitle id="vote-locked-dialog-title">Voting Locked</DialogTitle>
          <DialogContent>
            <DialogContentText id="vote-locked-dialog-description">
              Note: Voting is locked until everyone has voted.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
      <RankDialog
  open={rankDialogOpen}
  onClose={() => setRankDialogOpen(false)}
  songs={finalSongs}
  onUpdateSongs={() => { }}
  readonly={true}
  hideDialogActions={hasVotedFinal}
/>

    </Box>

  );
}
