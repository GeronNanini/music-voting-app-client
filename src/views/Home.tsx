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
  Skeleton,
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
    if (!loadingContent && !loading) {
      window.scrollTo(0, 0);
    }
  }, [loadingContent, loading]);
  

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
        backgroundImage: 'url("/green-wrinkled-paper.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        px: 3,
        pt: 4,
      }}
    >
      {/* Centered heading + song count */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          width: '100%',
          maxWidth: 600,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          paddingTop: 'calc(14vh)',
          paddingBottom: 'calc(20vh + 80px)', // spacing before the button stack
        }}
      >
        <img
          src="/home-heading.png"
          alt="Hottest 100 Heading"
          style={{ maxWidth: '90%', height: 'auto', display: 'block', margin: '0 auto' }}
        />

{loadingContent ? (
  <Skeleton
    variant="text"
    width={280}
    height={28}
    sx={{ mt: 2, mx: 'auto' }}
  />
) : songCount !== null && (
  <Typography
    variant="body1"
    sx={{ mt: 2, color: 'text.primary' }}
  >
    There {songCount === 1 ? 'is' : 'are'} currently {songCount}/110 song
    {songCount !== 1 ? 's' : ''} in the pool.
  </Typography>
)}

      </Box>

      {/* Fixed bottom button stack with skeletons */}
      <Box
  sx={{
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    backgroundImage: 'url("/mustard-dotted-scrap.png")',
    backgroundSize: 'cover',
    backgroundPosition: 'top',
    backgroundRepeat: 'no-repeat',
    py: 6,
    zIndex: 10,
  }}
>
  <Stack
    spacing={2}
    sx={{
      width: '90%',
      maxWidth: 600,
      mx: 'auto',
      px: 3,
    }}
    alignItems="center"
  >
    {loadingContent ? (
      <>
        <Skeleton
          variant="rectangular"
          width="100%"
          height={74}
          sx={{ borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={74}
          sx={{ borderRadius: 1 }}
        />
      </>
    ) : (
      <>
        <Button
          variant="contained"
          size="large"
          sx={{ py: 3, width: '100%', px: 2 }}
          onClick={() => navigate('/submit-initial')}
        >
          {hasSubmitted ? '✏️ Update my songs' : '🎧 Nominate Songs'}
        </Button>

        <Button
          variant="contained"
          size="large"
          color="primary"
          fullWidth
          sx={{ py: 3, width: '100%', px: 2 }}
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
      </>
    )}
  </Stack>
</Box>

      {/* Dialogs */}
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

      <RankDialog
        open={rankDialogOpen}
        onClose={() => setRankDialogOpen(false)}
        songs={finalSongs}
        onUpdateSongs={() => {}}
        readonly={true}
        hideDialogActions={hasVotedFinal}
      />
    </Box>
  );
}
