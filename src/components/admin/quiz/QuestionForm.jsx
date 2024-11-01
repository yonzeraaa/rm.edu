import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from '@mui/material';

function QuestionForm({
  open,
  onClose,
  currentQuestion,
  setCurrentQuestion,
  handleSaveQuestion,
  editingIndex,
  error,
  handleOptionChange,
}) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="question-dialog-title"
    >
      <DialogTitle id="question-dialog-title">
        {editingIndex !== null ? 'Editar Questão' : 'Nova Questão'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }} component="form">
          <TextField
            fullWidth
            id="question-text"
            name="question-text"
            label="Pergunta"
            value={currentQuestion.text}
            onChange={(e) => setCurrentQuestion({
              ...currentQuestion,
              text: e.target.value
            })}
            multiline
            rows={3}
            margin="normal"
            required
            aria-label="Texto da pergunta"
          />

          <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
            <FormLabel id="options-group-label" component="legend">Opções</FormLabel>
            {currentQuestion.options.map((option, index) => (
              <TextField
                key={index}
                fullWidth
                id={`option-${index}`}
                name={`option-${index}`}
                label={`Opção ${index + 1}`}
                value={option}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                margin="normal"
                required
                aria-label={`Opção ${index + 1}`}
              />
            ))}
          </FormControl>

          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <FormLabel id="correct-answer-label" component="legend">Resposta Correta</FormLabel>
            <RadioGroup
              aria-labelledby="correct-answer-label"
              value={currentQuestion.answer}
              onChange={(e) => setCurrentQuestion({
                ...currentQuestion,
                answer: parseInt(e.target.value)
              })}
            >
              {currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={index}
                  control={
                    <Radio 
                      id={`answer-${index}`}
                      name="correct-answer"
                    />
                  }
                  label={`Opção ${index + 1}`}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {error && (
            <Typography 
              color="error" 
              sx={{ mt: 2 }}
              role="alert"
              aria-live="polite"
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          color="inherit"
          id="cancel-button"
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSaveQuestion} 
          variant="contained" 
          color="primary"
          id="save-button"
        >
          {editingIndex !== null ? 'Atualizar' : 'Adicionar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default QuestionForm;
