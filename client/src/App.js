import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';

const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

function App() {
  const [socket, setSocket] = useState(null);
  const [fileId, setFileId] = useState('');
  const [otp, setOtp] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const newSocket = io(API_URL);
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('uploadInitiated', ({ fileId, otp }) => {
      setFileId(fileId);
      setOtp(otp);
      setStatus('File upload initiated. Share the OTP with the recipient.');
    });

    socket.on('chunkReceived', ({ index }) => {
      setUploadProgress((index + 1) * 100);
    });

    socket.on('fileMetadata', (metadata) => {
      setStatus('File metadata received. Starting download...');
    });

    socket.on('chunkData', ({ index, data }) => {
      setDownloadProgress((index + 1) * 100);
    });

    return () => {
      socket.off('uploadInitiated');
      socket.off('chunkReceived');
      socket.off('fileMetadata');
      socket.off('chunkData');
    };
  }, [socket]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError('');
    setStatus('Initiating upload...');

    socket.emit('initiateUpload', {
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type
    });

    const chunks = Math.ceil(file.size / CHUNK_SIZE);
    for (let i = 0; i < chunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);
      
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit('uploadChunk', {
          fileId,
          chunk: reader.result,
          index: i
        });
      };
      reader.readAsDataURL(chunk);
    }
  };

  const handleDownload = async () => {
    if (!fileId || !otp) {
      setError('Please enter both File ID and OTP');
      return;
    }

    setError('');
    setStatus('Verifying OTP...');

    socket.emit('verifyOTP', { fileId, otp }, (response) => {
      if (response.success) {
        setStatus('OTP verified. Requesting file...');
        socket.emit('requestFile', { fileId });
      } else {
        setError(response.message);
      }
    });
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          RAM File Share
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Upload File
              </Typography>
              <Button
                component="label"
                variant="contained"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                Choose File
                <VisuallyHiddenInput
                  type="file"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                />
              </Button>
              {uploadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <CircularProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary">
                    Upload Progress: {Math.round(uploadProgress)}%
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Download File
              </Typography>
              <TextField
                fullWidth
                label="File ID"
                value={fileId}
                onChange={(e) => setFileId(e.target.value)}
                margin="normal"
              />
              <TextField
                fullWidth
                label="OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                margin="normal"
              />
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
                fullWidth
                sx={{ mt: 2 }}
              >
                Download
              </Button>
              {downloadProgress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <CircularProgress variant="determinate" value={downloadProgress} />
                  <Typography variant="body2" color="text.secondary">
                    Download Progress: {Math.round(downloadProgress)}%
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>

        {status && (
          <Alert severity="info" sx={{ mt: 2 }}>
            {status}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Container>
  );
}

export default App; 