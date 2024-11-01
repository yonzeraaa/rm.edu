import { useEffect, useRef, useState } from 'react';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { isMobile, isTablet, isLandscape } from 'react-device-detect';
import { useTheme } from '@mui/material/styles';
import api, { videoService, studentService } from '../../services/api';
import { Button } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const VideoPlayer = ({ videoUrl, lessonId }) => {
  const videoRef = useRef(null);
  const plyrRef = useRef(null);
  const containerRef = useRef(null);
  const [videoSource, setVideoSource] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const theme = useTheme();
  let lastUpdateTime = 0;

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const videoBlob = await videoService.getVideo(videoUrl);
        setVideoSource(videoBlob);
      } catch (error) {
        console.error('Error loading video:', error);
      }
    };

    const checkProgress = async () => {
      try {
        const progress = await api.get('/student/progress');
        const lessonProgress = progress.find(p => p.lessonId === lessonId);
        if (lessonProgress) {
          setIsCompleted(lessonProgress.completed);
        }
      } catch (error) {
        console.error('Error checking progress:', error);
      }
    };

    loadVideo();
    checkProgress();

    return () => {
      if (videoSource) {
        URL.revokeObjectURL(videoSource);
      }
    };
  }, [videoUrl, lessonId]);

  useEffect(() => {
    if (videoRef.current && videoSource && !plyrRef.current) {
      plyrRef.current = new Plyr(videoRef.current, {
        controls: [
          'play-large',
          'play',
          'progress',
          'current-time',
          'mute',
          'volume',
          'fullscreen'
        ],
        ratio: '16:9',
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: true
        },
        clickToPlay: true,
        hideControls: false,
        resetOnEnd: false,
        keyboard: { focused: true, global: true },
        displayDuration: true,
        tooltips: { controls: true, seek: true }
      });

      const handleTimeUpdate = async () => {
        const currentTime = Math.floor(videoRef.current.currentTime);
        
        if (currentTime - lastUpdateTime >= 5) {
          try {
            await api.post(`/student/activity/${lessonId}`, {
              progress: currentTime,
              duration: Math.floor(videoRef.current.duration)
            });
            lastUpdateTime = currentTime;
          } catch (error) {
            console.error('Error updating progress:', error);
          }
        }
      };

      const handleFullscreenChange = () => {
        setIsFullscreen(plyrRef.current.fullscreen.active);
      };

      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      plyrRef.current.on('enterfullscreen', handleFullscreenChange);
      plyrRef.current.on('exitfullscreen', handleFullscreenChange);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        }
        if (plyrRef.current) {
          plyrRef.current.off('enterfullscreen', handleFullscreenChange);
          plyrRef.current.off('exitfullscreen', handleFullscreenChange);
          plyrRef.current.destroy();
        }
      };
    }
  }, [lessonId, videoSource]);

  const handleMarkAsWatched = async () => {
    try {
      await studentService.updateProgress(lessonId, true);
      setIsCompleted(true);
    } catch (error) {
      console.error('Error marking lesson as completed:', error);
    }
  };

  const containerStyles = {
    width: '100%',
    maxWidth: '100%',
    aspectRatio: '16/9',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    overflow: 'hidden',
    position: isFullscreen ? 'fixed' : 'relative',
    top: isFullscreen ? 0 : 'auto',
    left: isFullscreen ? 0 : 'auto',
    right: isFullscreen ? 0 : 'auto',
    bottom: isFullscreen ? 0 : 'auto',
    zIndex: isFullscreen ? theme.zIndex.modal : 'auto',
  };

  return (
    <div 
      ref={containerRef}
      className={`video-container ${isFullscreen ? 'fullscreen' : ''}`}
      style={containerStyles}
    >
      <video
        ref={videoRef}
        className="plyr-react plyr"
        controls
        src={videoSource}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        playsInline
      >
        <source src={videoSource} type="video/mp4" />
      </video>
      <Button
        variant="contained"
        color={isCompleted ? "success" : "primary"}
        onClick={handleMarkAsWatched}
        disabled={isCompleted}
        startIcon={<CheckCircleOutlineIcon />}
        sx={{
          mt: 2,
          mb: 2,
          width: 'fit-content'
        }}
      >
        {isCompleted ? "Aula Concluída" : "Marcar como Assistido"}
      </Button>
      <style jsx="true">{`
        .video-container {
          transition: all 0.3s ease;
        }
        .video-container.fullscreen {
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
        }
        .plyr {
          width: 100%;
          height: 100%;
        }
        .plyr--video {
          height: 100%;
          touch-action: pan-x pan-y;
        }
        .plyr__control--overlaid {
          padding: ${isMobile ? '16px' : '20px'};
          background: rgba(0, 0, 0, 0.6);
        }
        .plyr--full-ui input[type=range] {
          touch-action: auto;
        }
        .plyr__controls {
          padding: ${isMobile ? '8px' : '10px'} !important;
          background: rgba(0, 0, 0, 0.8) !important;
        }
        @media (orientation: portrait) {
          .plyr__controls {
            font-size: 14px;
          }
        }
        @media (orientation: landscape) {
          .plyr__controls {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;
