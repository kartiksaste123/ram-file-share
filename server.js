const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// Root route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'RAM File Share API is running' });
});

// In-memory storage for file metadata and chunks
const fileStorage = new Map();
const activeConnections = new Map();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a unique file ID
const generateFileId = () => {
  return uuidv4();
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('initiateUpload', (fileInfo) => {
    const fileId = generateFileId();
    const otp = generateOTP();
    
    fileStorage.set(fileId, {
      metadata: {
        fileName: fileInfo.fileName,
        fileSize: fileInfo.fileSize,
        mimeType: fileInfo.mimeType,
        chunks: [],
        otp,
        createdAt: Date.now(),
        expiresAt: Date.now() + (30 * 60 * 1000) // 30 minutes expiry
      }
    });

    socket.emit('uploadInitiated', { fileId, otp });
  });

  socket.on('uploadChunk', ({ fileId, chunk, index }) => {
    const fileData = fileStorage.get(fileId);
    if (fileData) {
      fileData.metadata.chunks[index] = chunk;
      fileStorage.set(fileId, fileData);
      socket.emit('chunkReceived', { index });
    }
  });

  socket.on('verifyOTP', ({ fileId, otp }, callback) => {
    const fileData = fileStorage.get(fileId);
    if (fileData && fileData.metadata.otp === otp) {
      callback({ success: true });
    } else {
      callback({ success: false, message: 'Invalid OTP' });
    }
  });

  socket.on('requestFile', ({ fileId }) => {
    const fileData = fileStorage.get(fileId);
    if (fileData) {
      socket.emit('fileMetadata', {
        fileName: fileData.metadata.fileName,
        fileSize: fileData.metadata.fileSize,
        mimeType: fileData.metadata.mimeType,
        totalChunks: fileData.metadata.chunks.length
      });
    }
  });

  socket.on('requestChunk', ({ fileId, index }) => {
    const fileData = fileStorage.get(fileId);
    if (fileData && fileData.metadata.chunks[index]) {
      socket.emit('chunkData', {
        index,
        data: fileData.metadata.chunks[index]
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Cleanup expired files periodically
setInterval(() => {
  const now = Date.now();
  for (const [fileId, fileData] of fileStorage.entries()) {
    if (fileData.metadata.expiresAt < now) {
      fileStorage.delete(fileId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 