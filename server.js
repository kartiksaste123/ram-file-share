const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const crypto = require('crypto-js');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
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

// Check possible locations for client build
const possibleBuildPaths = [
  path.join(__dirname, 'client/build'),
  path.join(__dirname, 'build'),
  path.join(__dirname, '..', 'client/build'),
  path.join(__dirname, '..', 'build')
];

let clientBuildPath = null;
let clientBuildExists = false;

// Log detailed information about the current directory
console.log(`Current directory: ${__dirname}`);
console.log(`Current working directory: ${process.cwd()}`);

// Check each possible build path
for (const buildPath of possibleBuildPaths) {
  console.log(`Checking build path: ${buildPath}`);
  if (fs.existsSync(buildPath)) {
    console.log(`Found client build at: ${buildPath}`);
    clientBuildPath = buildPath;
    clientBuildExists = true;
    break;
  }
}

// If no build directory found, check for a simple index.html in the root
const rootIndexPath = path.join(__dirname, 'index.html');
const rootIndexExists = fs.existsSync(rootIndexPath);
console.log(`Root index.html exists: ${rootIndexExists}`);

// Log directory contents for debugging
console.log('Contents of current directory:');
try {
  const files = fs.readdirSync(__dirname);
  files.forEach(file => {
    console.log(`- ${file}`);
  });
} catch (err) {
  console.error('Error reading current directory:', err);
}

// Serve static files from the React app if the directory exists
if (clientBuildExists) {
  console.log(`Serving static files from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));
  
  // Root route handler
  app.get('/', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else if (rootIndexExists) {
  // Serve the simple index.html if it exists
  console.log('Serving simple index.html from root directory');
  app.get('/', (req, res) => {
    res.sendFile(rootIndexPath);
  });
} else {
  // Fallback route if no build or index.html exists
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>RAM File Share API</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #1976d2; }
            .status { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
            .error { color: #d32f2f; }
          </style>
        </head>
        <body>
          <h1>RAM File Share API</h1>
          <div class="status">
            <p>The API is running, but the client build is not available yet.</p>
            <p>This could be due to a build error or the build process not completing successfully.</p>
            <p>Please check the Render logs for more information.</p>
          </div>
          <div class="status">
            <h2>API Status</h2>
            <p>You can check the API status at <a href="/api/status">/api/status</a></p>
          </div>
        </body>
      </html>
    `);
  });
}

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'RAM File Share API is running',
    clientBuildAvailable: clientBuildExists,
    currentDirectory: __dirname,
    workingDirectory: process.cwd(),
    clientBuildPath: clientBuildPath,
    rootIndexExists: rootIndexExists,
    possibleBuildPaths: possibleBuildPaths
  });
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
  console.log(`Client build available: ${clientBuildExists}`);
  if (clientBuildExists) {
    console.log(`Client build path: ${clientBuildPath}`);
  }
}); 