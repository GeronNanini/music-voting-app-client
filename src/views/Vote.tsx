import { useEffect, useState } from 'react';
import {
  Container,
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
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import RankDialog from '../components/RankDialog';

const API_URL = import.meta.env.VITE_API_URL;
const MAX_VOTES = 10;

const Vote = () => {
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<any[]>([]); // State to hold filtered songs
  const [user, setUser] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rankDialogOpen, setRankDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedYearRange, setSelectedYearRange] = useState<string>(''); // New state for selected year range
  const [searchQuery, setSearchQuery] = useState('');

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
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/aggregated-songs`);
      const data = await res.json();
      setAllSongs(data.songs || []);
      setFilteredSongs(data.songs || []); // Initialize filtered songs
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to load songs');
    } finally {
      setLoading(false);
    }
  };

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

    try {
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
    } catch (err) {
      setError('Error submitting vote.');
    }
  };

  const handleFilterChange = (yearRange: string) => {
    setSelectedYearRange(yearRange);
    filterSongsByYearRange(yearRange);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    filterSongsByYearRange(selectedYearRange, query);
  };


  const filterSongsByYearRange = (yearRange: string, query = searchQuery) => {
    let songs = allSongs;

    if (yearRange && yearRange !== 'All') {
      const [startYear, endYear] = yearRange.split('-').map(Number);
      songs = songs.filter((song: any) => {
        const songYear = new Date(song.releaseDate).getFullYear();
        return songYear >= startYear && songYear <= endYear;
      });
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      songs = songs.filter((song: any) =>
        song.name.toLowerCase().includes(lowerQuery) ||
        song.artist.toLowerCase().includes(lowerQuery)
      );
    }

    setFilteredSongs(songs);
  };


  const renderSongList = () => (
    <List sx={{ mb: 2, width: '100%' }}>
      {filteredSongs.map((song: any) => (
        <ListItem key={song.spotifyUrl} sx={listItemStyle}>
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <ListItemAvatar>
              <Avatar src={song.imageUrl} alt={`${song.name} album cover`} variant="square" />
            </ListItemAvatar>
            <ListItemText
              primary={song.name}
              secondary={`${song.artist} • ${song.album}`}
              sx={listItemTextStyle}
            />
          </Box>

          <Button
            variant="contained"
            onClick={() =>
              selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)
                ? handleRemoveSong(song)
                : handleAddSong(song)
            }
            disabled={selectedSongs.length >= MAX_VOTES && !selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl)}
            color={selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl) ? 'error' : 'primary'}
            sx={{ minWidth: '100px', marginLeft: 'auto', marginTop: '10px' }}
          >
            {selectedSongs.some((s) => s.spotifyUrl === song.spotifyUrl) ? 'Remove' : 'Add'}
          </Button>
        </ListItem>
      ))}
    </List>
  );

  const renderFilterChips = () => (
    <Box sx={{ px: 2, py: 1 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
        }}
      >
        {['All', '2000-2004', '2005-2009', '2010-2014', '2015-2019', '2020-2025'].map((yearRange) => (
          <Chip
            key={yearRange}
            label={yearRange}
            variant={selectedYearRange === yearRange ? 'filled' : 'outlined'}
            color={selectedYearRange === yearRange ? 'primary' : 'default'}
            onClick={() => handleFilterChange(yearRange)}
            sx={{ cursor: 'pointer', width: '100%' }}
          />
        ))}
      </Box>
    </Box>
  );


  const renderFooter = () => (
    <Box sx={footerStyle}>
      <Box sx={footerContentStyle}>
        <Box sx={footerTextStyle}>
          {selectedSongs.length} / {MAX_VOTES} songs selected
        </Box>
        <Button
          variant="contained"
          onClick={() => setRankDialogOpen(true)}
          disabled={selectedSongs.length === 0}
          sx={footerButtonStyle}
        >
          View Shortlist
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={mainContainerStyle}>
      {loading ? (
        <Box sx={loadingStyle}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box sx={headerStyle}>
            <Container>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  px: 0,
                  gap: 1,
                }}
              >
                <IconButton onClick={() => navigate(-1)}>
                  <ChevronLeftIcon />
                </IconButton>
                <Box sx={{ flex: 1 }}>
                <input
  type="text"
  placeholder="Search songs or artists"
  value={searchQuery}
  onChange={handleSearchChange}
  style={{
    width: '100%',
    padding: '8px 12px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #ccc',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',     // Light mode background
    color: '#000',               // Light mode text color
    WebkitTextFillColor: '#000' // Force text color in autofill
  }}
/>

                </Box>
              </Box>
            </Container>
          </Box>



          {/* Filter Chips */}
          {renderFilterChips()}

          <Container maxWidth={false} sx={{ pb: 12, backgroundColor: '#fff' }}>
            <RankDialog
              open={rankDialogOpen}
              onClose={() => setRankDialogOpen(false)}
              songs={selectedSongs}
              onUpdateSongs={setSelectedSongs}
            />
            {renderSongList()}

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={selectedSongs.length === 0}
              sx={{ bgcolor: 'primary.main' }}
            >
              Submit Vote
            </Button>

            {submitted && <Alert severity="success" sx={{ mt: 2 }}>Vote submitted successfully!</Alert>}
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Container>

          {renderFooter()}
        </>
      )}
    </Box>
  );
};

// Styles
const listItemStyle = {
  borderBottom: '1px solid #eee',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  width: '100%',
  px: 1,
  backgroundColor: 'background.paper',
};

const listItemTextStyle = {
  ml: 0,
  mr: 2,
  whiteSpace: 'normal',
  wordWrap: 'break-word',
  width: 'calc(100% - 80px)',
  color: 'black',
};

const footerStyle = {
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
};

const footerContentStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  width: '100%',
  maxWidth: '100%',
  margin: '0 auto',
  gap: 2,
};

const footerTextStyle = {
  color: 'black',
  fontWeight: 'normal',
  fontSize: '0.875rem',
  whiteSpace: 'normal',
  flex: 1,
};

const footerButtonStyle = {
  whiteSpace: 'nowrap',
  flexShrink: 0,
  boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
  borderRadius: '12px',
  backgroundColor: 'primary.main',
};

const mainContainerStyle = {
  width: '100vw',
  minHeight: '100vh',
  backgroundColor: '#fff',
};

const loadingStyle = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#fff',
};

const headerStyle = {
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  backgroundColor: '#fff',
  borderBottom: '1px solid #ccc',
  px: 0,
  py: 2,
};

export default Vote;