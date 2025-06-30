import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box
} from '@mui/material';

const RelationDialog = ({ open, onClose, nodes, sourceNode, onCreate }) => {
  const [targetId, setTargetId] = useState('');
  const [label, setLabel] = useState('');

  const handleSubmit = () => {
    if (targetId && label) {
      onCreate(targetId, label);
      setTargetId('');
      setLabel('');
    }
  };

  const handleClose = () => {
    setTargetId('');
    setLabel('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Crea Nuova Relazione
        {sourceNode && ` da ${sourceNode.name}`}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Entità di Destinazione</InputLabel>
            <Select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              label="Entità di Destinazione"
            >
              {nodes?.map((node) => (
                <MenuItem key={node.id} value={node.id}>
                  {node.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Etichetta Relazione"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="es. proprietario, collegato a, dipende da"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annulla</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!targetId || !label}
        >
          Crea Relazione
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RelationDialog;