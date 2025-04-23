import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Box,
  Typography,
  IconButton,
  Slide,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { ArrowUpward, ArrowDownward, Delete, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

type RankDialogProps = {
    open: boolean;
    onClose: () => void;
    songs: any[];
    onUpdateSongs: (newOrder: any[]) => void;
    readonly?: boolean;
    hideDialogActions?: boolean;
  };

  const Transition = (props: any) => <Slide direction="up" {...props} />;

export default function RankDialog({
    open,
    onClose,
    songs,
    onUpdateSongs,
    readonly = false,
    hideDialogActions = false, // Default to false
  }: RankDialogProps) {
  const navigate = useNavigate();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSnackbarOpen, setSubmittedSnackbarOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (readonly || !result.destination) return;
    const updated = Array.from(songs);
    const [moved] = updated.splice(result.source.index, 1);
    updated.splice(result.destination.index, 0, moved);
    onUpdateSongs(updated);
  };

  const reorderSong = (from: number, to: number) => {
    if (readonly || to < 0 || to >= songs.length) return;
    const updated = [...songs];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    onUpdateSongs(updated);
  };

  const handleDelete = (index: number) => {
    if (readonly) return;
    const updated = [...songs];
    updated.splice(index, 1);
    onUpdateSongs(updated);
  };

  const handleSubmitShortlist = async () => {
    if (readonly) return;
    const user = localStorage.getItem('userName');
    if (!user) return console.error('No userName in localStorage');

    const rankedSongs = songs.map((song, index) => ({
      rank: index + 1,
      name: song.name,
      artist: song.artist,
      album: song.album,
      imageUrl: song.imageUrl,
      spotifyUrl: song.spotifyUrl,
    }));

    // TODO: update to axios
    const res = await fetch(`${API_URL}/api/submit-final-vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, songs: rankedSongs }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || 'Failed to submit shortlist');
    }
  };

  const handleFinalSubmission = async () => {
    setConfirmDialogOpen(false); // ✅ Close the dialog
  
    setSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 1800));
      await handleSubmitShortlist();
      setSubmittedSnackbarOpen(true);
      setTimeout(() => navigate('/home'), 3000);
    } catch (err) {
      console.error('Submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };
  

  const handleOpenConfirmDialog = () => {
    songs.length !== 10 ? setSnackbarOpen(true) : setConfirmDialogOpen(true);
  };

  return (
    <>
      <Dialog 
      open={open} 
      onClose={onClose} 
      fullScreen 
      TransitionComponent={Transition} 
>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Your Votes
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 0, pt: 0 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="rankedSongs">
              {(provided) => (
                <List
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ bgcolor: '#f9f9f9', width: '100%', px: 0 }}
                >
                  {songs.map((song, index) => (
                    <Draggable key={song.spotifyUrl} draggableId={song.spotifyUrl} index={index}>
                      {(provided, snapshot) => (
                        <ListItem
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            bgcolor: snapshot.isDragging ? '#e3f2fd' : 'white',
                            borderBottom: '1px solid #ddd',
                            px: 2,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body1" sx={{ minWidth: 24, mr: 2 }}>
                              {index + 1}
                            </Typography>
                            <ListItemAvatar>
                              <Avatar src={song.imageUrl} alt={song.name} variant="square" />
                            </ListItemAvatar>
                          </Box>
                          <ListItemText
                            primary={song.name}
                            secondary={`${song.artist} • ${song.album}`}
                            sx={{ ml: 1 }}
                          />
                          {/* Render these icons only if not readonly */}
                          {!readonly && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <IconButton onClick={() => reorderSong(index, index - 1)} size="small" disabled={index === 0}>
                                <ArrowUpward />
                              </IconButton>
                              <IconButton onClick={() => reorderSong(index, index + 1)} size="small" disabled={index === songs.length - 1}>
                                <ArrowDownward />
                              </IconButton>
                              <IconButton onClick={() => handleDelete(index)} size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Box>
                          )}
                        </ListItem>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </List>
              )}
            </Droppable>
          </DragDropContext>
        </DialogContent>

        {!hideDialogActions && (
          <DialogActions
            sx={{ px: 3, pb: 2, pt: 2, flexDirection: 'column', alignItems: 'center' }}
          >
            <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
              Note: Be sure to rank your top 10 in the correct order. You can drag and drop to reorder.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ py: 2, px: 2, gap: 1 }}
              color="primary"
              onClick={handleOpenConfirmDialog}
              disabled={submitting}
            >
              {submitting && <CircularProgress size={20} sx={{ color: 'white' }} />}
              {submitting ? 'Submitting...' : 'Submit Shortlist'}
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Ready to submit?</DialogTitle>
        <DialogContent>
          <Typography>
            Once you submit your votes, you won’t be able to make any changes.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} color="primary">
            No, go back
          </Button>
          <Button onClick={handleFinalSubmission} color="primary" variant="contained">
            Yes, submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Validation Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setSnackbarOpen(false)}>
          Please add {10 - songs.length} more song{10 - songs.length !== 1 ? 's' : ''} to continue.
        </Alert>
      </Snackbar>

      {/* Submission Snackbar */}
      <Snackbar
        open={submittedSnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSubmittedSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSubmittedSnackbarOpen(false)} sx={{ width: '100%' }}>
          Your shortlist was submitted!
        </Alert>
      </Snackbar>
    </>
  );
}
