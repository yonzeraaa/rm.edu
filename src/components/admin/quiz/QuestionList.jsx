import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Typography,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

function QuestionList({ questions, onEdit, onDelete }) {
  const getOptions = (question) => {
    try {
      return Array.isArray(question.options) 
        ? question.options 
        : JSON.parse(question.options);
    } catch (error) {
      console.error('Error parsing options:', error);
      return [];
    }
  };

  if (!questions || questions.length === 0) {
    return (
      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
        Nenhuma questão adicionada ainda.
      </Typography>
    );
  }

  return (
    <List aria-label="Lista de questões">
      {questions.map((question, index) => (
        <Paper 
          key={index} 
          elevation={1} 
          sx={{ 
            mb: 2,
            '&:hover': {
              boxShadow: 3,
            },
          }}
        >
          <ListItem
            secondaryAction={
              <Box>
                <IconButton 
                  edge="end" 
                  onClick={() => onEdit(index)}
                  sx={{ mr: 1 }}
                  aria-label={`Editar questão ${index + 1}`}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  edge="end" 
                  onClick={() => onDelete(index)}
                  color="error"
                  aria-label={`Excluir questão ${index + 1}`}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            }
          >
            <ListItemText
              primary={
                <Typography 
                  variant="subtitle1" 
                  sx={{ fontWeight: 'bold', mb: 1 }}
                  component="h3"
                >
                  {`${index + 1}. ${question.text}`}
                </Typography>
              }
              secondary={
                <Box sx={{ pl: 2 }} component="div" role="list">
                  {getOptions(question).map((option, optIndex) => (
                    <Typography
                      key={optIndex}
                      variant="body2"
                      sx={{
                        color: question.answer === optIndex ? 'success.main' : 'text.secondary',
                        fontWeight: question.answer === optIndex ? 'bold' : 'normal',
                        mb: 0.5,
                      }}
                      component="div"
                      role="listitem"
                    >
                      {`${String.fromCharCode(65 + optIndex)}. ${option}`}
                      {question.answer === optIndex && (
                        <Typography 
                          component="span" 
                          sx={{ ml: 1 }}
                          aria-label="Resposta correta"
                        >
                          ✓
                        </Typography>
                      )}
                    </Typography>
                  ))}
                </Box>
              }
            />
          </ListItem>
        </Paper>
      ))}
    </List>
  );
}

export default QuestionList;
