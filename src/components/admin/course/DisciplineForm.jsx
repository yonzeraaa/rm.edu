import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
} from '@mui/material';

function DisciplineForm({
  open,
  onClose,
  onSubmit,
  editingDiscipline,
  disciplineFormData,
  setDisciplineFormData,
  isMobile,
}) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
    >
      <DialogTitle>
        {editingDiscipline ? 'Editar Disciplina' : 'Nova Disciplina'}
      </DialogTitle>
      <form onSubmit={onSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Título"
              value={disciplineFormData.title}
              onChange={(e) =>
                setDisciplineFormData({
                  ...disciplineFormData,
                  title: e.target.value,
                })
              }
              required
              fullWidth
            />
            <TextField
              label="Descrição"
              value={disciplineFormData.description}
              onChange={(e) =>
                setDisciplineFormData({
                  ...disciplineFormData,
                  description: e.target.value,
                })
              }
              multiline
              rows={4}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            {editingDiscipline ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DisciplineForm;
