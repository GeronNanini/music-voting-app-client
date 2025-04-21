import React, { useState, useEffect, useRef } from 'react';
import {
    TextField,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Box,
} from '@mui/material';
import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL;

export interface SongResult {
    name: string;
    artist: string;
    album: string;
    imageUrl: string;
    previewUrl: string;
    spotifyUrl: string;
}

interface SearchComponentProps {
    onSelect: (song: SongResult) => void;
}

const TOKEN_KEY = 'spotify_token';
const TOKEN_TIMESTAMP_KEY = 'spotify_token_timestamp';
const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes

const SearchComponent: React.FC<SearchComponentProps> = ({ onSelect }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SongResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const debounceDelay = 200;

    const hasInteracted = useRef(false);

    const loadToken = async () => {
        const cachedToken = localStorage.getItem(TOKEN_KEY);
        const timestamp = parseInt(localStorage.getItem(TOKEN_TIMESTAMP_KEY) || '0');

        const isTokenValid = cachedToken && Date.now() - timestamp < TOKEN_TTL_MS;

        if (isTokenValid) {
            setToken(cachedToken);
        } else {
            try {
                const res = await axios.get(`${API_URL}/api/spotify/token`);
                const newToken = res.data.access_token;
                setToken(newToken);
                localStorage.setItem(TOKEN_KEY, newToken);
                localStorage.setItem(TOKEN_TIMESTAMP_KEY, Date.now().toString());
            } catch (err) {
                console.error('Failed to get Spotify token:', err);
                setError('Failed to initialize Spotify search.');
            }
        }
    };

    useEffect(() => {
        if (query.length < 3 || !token) {
            setResults([]);
            return;
        }

        const fetchSongs = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await axios.post(`${API_URL}/api/spotify/search`, {
                    token,
                    query,
                });

                setResults(response.data);
            } catch (err) {
                console.error(err);
                setError('Error fetching songs. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        const debounceSearch = setTimeout(() => {
            fetchSongs();
        }, debounceDelay);

        return () => clearTimeout(debounceSearch);
    }, [query, token]);

    const handleInteraction = () => {
        if (!hasInteracted.current) {
            hasInteracted.current = true;
            loadToken();
        }
    };

    return (
        <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
            <TextField
                label="Search Songs"
                variant="outlined"
                fullWidth
                value={query}
                onFocus={handleInteraction}
                onChange={(e) => {
                    handleInteraction();
                    setQuery(e.target.value);
                }}
                sx={{ mb: 2 }}
            />

            {loading && <CircularProgress sx={{ display: 'block', margin: 'auto' }} />}
            {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}

            {!loading && !error && results.length > 0 && (
                <List>
                    {results.map((song, index) => (
                        <ListItem
                            key={index}
                            onClick={() => onSelect(song)}
                            sx={{ alignItems: 'flex-start', cursor: 'pointer' }}
                        >
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <img
                                    src={song.imageUrl}
                                    alt={song.album}
                                    width={64}
                                    height={64}
                                    style={{ borderRadius: 4 }}
                                />
                                <Box>
                                    <ListItemText
                                        primary={song.name}
                                        secondary={`${song.artist} – ${song.album}`}
                                    />
                                    {song.previewUrl && (
                                        <audio controls src={song.previewUrl} style={{ marginTop: 8, width: '100%' }}>
                                            Your browser does not support the audio element.
                                        </audio>
                                    )}
                                </Box>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
};

export default SearchComponent;
