import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { lessonService } from '../../../services/api';

function LessonUploader({ disciplineId, onUploadComplete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [contentType, setContentType] = useState('VIDEO');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    // Validar tipo de arquivo baseado no contentType selecionado
    const validTypes = {
      VIDEO: ['video/mp4', 'video/webm'],
      PDF: ['application/pdf'],
      IMAGE: ['image/jpeg', 'image/png', 'image/gif']
    };

    if (!validTypes[contentType].includes(selectedFile.type)) {
      setError(`Tipo de arquivo inválido. Por favor, selecione um arquivo ${contentType.toLowerCase()} válido.`);
      return;
    }

    setFile(selectedFile);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission
    
    if (!file || !title) {
      setError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    // Map contentType to the correct field name
    const fieldMap = {
      VIDEO: 'video',
      PDF: 'pdf',
      IMAGE: 'image'
    };
    formData.append(fieldMap[contentType], file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('order', '1'); // Add default order
    formData.append('disciplineId', disciplineId.toString()); // Add disciplineId to form data

    try {
      console.log('Uploading lesson with disciplineId:', disciplineId);
      const response = await lessonService.createLesson(disciplineId, formData);
      setTitle('');
      setDescription('');
      setFile(null);
      if (onUploadComplete) {
        onUploadComplete(response);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error.response?.data?.error || 'Erro ao fazer upload da aula. Por favor, tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload de Nova Aula
      </Typography>
      <Box 
        component="form" 
        onSubmit={handleSubmit} 
        sx={{ mt: 2 }}
      >
        <TextField
          fullWidth
          label="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Tipo de Conteúdo</InputLabel>
          <Select
            value={contentType}
            onChange={(e) => {
              setContentType(e.target.value);
              setFile(null); // Clear file when changing type
            }}
            label="Tipo de Conteúdo"
          >
            <MenuItem value="VIDEO">Vídeo</MenuItem>
            <MenuItem value="PDF">PDF</MenuItem>
            <MenuItem value="IMAGE">Imagem</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUpload />}
          sx={{ mt: 2, mb: 2 }}
        >
          Selecionar Arquivo
          <input
            type="file"
            hidden
            onChange={handleFileChange}
            accept={
              contentType === 'VIDEO' ? 'video/*' :
              contentType === 'PDF' ? 'application/pdf' :
              'image/*'
            }
          />
        </Button>
        {file && (
          <Typography variant="body2" sx={{ ml: 2 }}>
            Arquivo selecionado: {file.name}
          </Typography>
        )}
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          disabled={uploading || !file || !title}
          sx={{ mt: 2 }}
        >
          {uploading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Enviando...
            </>
          ) : (
            'Enviar'
          )}
        </Button>
      </Box>
    </Paper>
  );
}

export default LessonUploader;
