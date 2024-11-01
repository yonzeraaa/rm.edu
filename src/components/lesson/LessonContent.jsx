import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  useTheme, 
  useMediaQuery,
  CircularProgress,
  Fab,
  Zoom,
  alpha,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  CheckCircleOutline,
  CheckCircle,
  ZoomIn,
  ZoomOut,
  PictureAsPdf,
  BrokenImage,
  Image,
} from '@mui/icons-material';
import VideoPlayer from './VideoPlayer';

function LessonContent({ lesson, onComplete, completed }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [pdfScale, setPdfScale] = useState(1);

  if (!lesson || !lesson.content) {
    return (
      <Box 
        sx={{ 
          p: 2,
          textAlign: 'center',
          height: '80%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
        }}
      >
        <BrokenImage sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
        <Typography variant="h6" color="error" gutterBottom>
          Nenhum conteúdo disponível
        </Typography>
        <Typography variant="body2" color="text.secondary">
          O conteúdo desta aula não está disponível no momento
        </Typography>
      </Box>
    );
  }

  const handleContentLoad = () => {
    setLoading(false);
  };

  const renderContent = () => {
    switch (lesson.content.type) {
      case 'VIDEO':
        return (
          <Box 
            sx={{ 
              width: '100%',
              height: '2400px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'background.paper',
              overflow: 'hidden',
            }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                width: '100%',
                maxWidth: '600px',
                bgcolor: 'black',
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <VideoPlayer 
                videoUrl={lesson.content.url} 
                lessonId={lesson.id}
              />
            </Paper>
          </Box>
        );
      
      case 'PDF':
        return (
          <Box 
            sx={{ 
              width: '100%',
              height: isMobile ? 'calc(100vh - 180px)' : '100%',
              position: 'relative',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: isMobile ? 0 : 1,
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                right: 0,
                zIndex: 2,
                display: 'flex',
                gap: 1,
                p: 1,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title="Diminuir zoom">
                <IconButton 
                  size="small"
                  onClick={() => setPdfScale(prev => Math.max(0.5, prev - 0.25))}
                >
                  <ZoomOut />
                </IconButton>
              </Tooltip>
              <Tooltip title="Aumentar zoom">
                <IconButton 
                  size="small"
                  onClick={() => setPdfScale(prev => Math.min(2, prev + 0.25))}
                >
                  <ZoomIn />
                </IconButton>
              </Tooltip>
            </Box>
            <iframe
              src={`${lesson.content.url}#zoom=${pdfScale}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title={lesson.title}
              onLoad={handleContentLoad}
            />
            {loading && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                }}
              >
                <PictureAsPdf sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        );
      
      case 'IMAGE':
        return (
          <Box
            sx={{
              width: '100%',
              height: isMobile ? 'calc(100vh - 180px)' : '100%',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: isMobile ? 0 : 1,
            }}
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                right: 0,
                zIndex: 2,
                display: 'flex',
                p: 1,
                bgcolor: 'background.paper',
                borderBottom: 1,
                borderColor: 'divider',
                justifyContent: 'flex-end',
              }}
            >
              <Tooltip title={imageZoomed ? "Diminuir" : "Ampliar"}>
                <IconButton 
                  onClick={() => setImageZoomed(!imageZoomed)}
                >
                  {imageZoomed ? <ZoomOut /> : <ZoomIn />}
                </IconButton>
              </Tooltip>
            </Box>
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                p: 2,
              }}
            >
              <img
                src={lesson.content.url}
                alt={lesson.title}
                style={{
                  maxWidth: imageZoomed ? 'none' : '100%',
                  maxHeight: imageZoomed ? 'none' : '100%',
                  width: imageZoomed ? 'auto' : '100%',
                  height: imageZoomed ? 'auto' : '100%',
                  objectFit: 'contain',
                  transition: 'all 0.3s ease',
                }}
                onLoad={handleContentLoad}
              />
            </Box>
            {loading && (
              <Box 
                sx={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'background.paper',
                }}
              >
                <Image sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
        );
      
      default:
        return (
          <Box 
            sx={{ 
              p: 2,
              textAlign: 'center',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              background: `linear-gradient(45deg, ${alpha(theme.palette.warning.main, 0.05)}, ${alpha(theme.palette.background.paper, 1)})`,
            }}
          >
            <BrokenImage sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" color="warning.main" gutterBottom>
              Tipo de conteúdo não suportado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              O formato deste conteúdo não é suportado pela plataforma
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Box 
      sx={{ 
        height: '100%', 
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {renderContent()}
      
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          mt: 'auto',
        }}
      >
        <Zoom in={!loading}>
          <Fab
            color={completed ? "success" : "primary"}
            variant={isMobile ? "circular" : "extended"}
            onClick={onComplete}
            disabled={completed}
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          >
            {completed ? (
              <CheckCircle />
            ) : (
              <>
                <CheckCircleOutline sx={{ mr: isMobile ? 0 : 1 }} />
                {!isMobile && "Marcar como Concluída"}
              </>
            )}
          </Fab>
        </Zoom>
      </Box>
    </Box>
  );
}

export default LessonContent;
