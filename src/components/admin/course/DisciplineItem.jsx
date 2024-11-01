import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Button,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  VideoLibrary as VideoIcon,
  Description as PdfIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { lessonService } from '../../../services/api';

function DisciplineItem({ 
  discipline, 
  onEdit, 
  onDelete,
  onUploadLesson,
  children 
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);

  const getFileIcon = (lesson) => {
    if (lesson.content?.type === 'VIDEO') return <VideoIcon />;
    if (lesson.content?.type === 'PDF') return <PdfIcon />;
    if (lesson.content?.type === 'IMAGE') return <ImageIcon />;
    return null;
  };

  const handleDeleteFile = async (lessonId, fileType) => {
    if (window.confirm('Tem certeza que deseja excluir este arquivo?')) {
      try {
        await lessonService.deleteFile(lessonId, fileType);
        // Reload the page to update the file list
        window.location.reload();
      } catch (error) {
        console.error('Error deleting file:', error);
        alert('Erro ao excluir arquivo');
      }
    }
  };

  const handleAddLesson = (e) => {
    e.preventDefault(); // Prevent default form submission
    onUploadLesson(discipline.id);
  };

  const renderFileList = (lesson) => {
    const files = [];
    
    if (lesson.videoUrl) {
      files.push({
        type: 'VIDEO',
        url: lesson.videoUrl,
        name: 'Vídeo da aula'
      });
    }
    
    if (lesson.pdfUrl) {
      files.push({
        type: 'PDF',
        url: lesson.pdfUrl,
        name: 'Material em PDF'
      });
    }
    
    if (lesson.imageUrl) {
      files.push({
        type: 'IMAGE',
        url: lesson.imageUrl,
        name: 'Imagem da aula'
      });
    }

    return files.map((file, index) => (
      <ListItem
        key={`${file.type}-${index}`}
        sx={{
          bgcolor: 'background.default',
          mb: 1,
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
      >
        <Box sx={{ mr: 1 }}>
          {file.type === 'VIDEO' && <VideoIcon />}
          {file.type === 'PDF' && <PdfIcon />}
          {file.type === 'IMAGE' && <ImageIcon />}
        </Box>
        <ListItemText
          primary={file.name}
          secondary={
            <Button
              size="small"
              onClick={() => window.open(file.url, '_blank')}
            >
              Visualizar
            </Button>
          }
        />
        <ListItemSecondaryAction>
          <IconButton
            edge="end"
            onClick={() => handleDeleteFile(lesson.id, file.type.toLowerCase())}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    ));
  };

  return (
    <Box sx={{ 
      bgcolor: 'background.paper',
      borderRadius: 1,
      p: 2,
      mb: 2,
      boxShadow: 1
    }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" component="div">
            {discipline.title}
          </Typography>
          {discipline.description && (
            <Typography variant="body2" color="text.secondary">
              {discipline.description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ 
          display: 'flex', 
          gap: 1,
          width: isMobile ? '100%' : 'auto',
          justifyContent: isMobile ? 'space-between' : 'flex-end'
        }}>
          <IconButton 
            onClick={() => onEdit(discipline)}
            size="small"
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton 
            onClick={() => onDelete(discipline.id)}
            size="small"
            color="error"
          >
            <DeleteIcon />
          </IconButton>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s',
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAddLesson}
            fullWidth={isMobile}
            sx={{ mb: 2 }}
          >
            Adicionar Aula
          </Button>

          {children}

          {discipline.lessons && discipline.lessons.length > 0 && (
            <List>
              {discipline.lessons.map((lesson) => (
                <Box key={lesson.id} sx={{ mb: 2 }}>
                  <ListItem
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      boxShadow: 1,
                    }}
                  >
                    <Box sx={{ mr: 1 }}>
                      {getFileIcon(lesson)}
                    </Box>
                    <ListItemText
                      primary={lesson.title}
                      secondary={lesson.description}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => onDelete(discipline.id, lesson.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Box sx={{ pl: 2 }}>
                    {renderFileList(lesson)}
                  </Box>
                </Box>
              ))}
            </List>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

export default DisciplineItem;
