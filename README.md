# RAM File Share

A secure file sharing application that uses RAM for temporary storage and client-side file handling. Files are never stored on the server's disk and are automatically cleared after a certain period.

## Features

- RAM-based file storage (no disk storage)
- Secure file transfer with OTP verification
- Real-time progress tracking
- Modern, responsive UI
- Automatic file cleanup after 30 minutes
- Chunk-based file transfer for large files

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   npm start
   ```

2. Start the frontend development server:
   ```bash
   cd client
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## How to Use

### Sharing a File

1. Click the "Choose File" button to select a file
2. Wait for the upload to complete
3. Share the File ID and OTP with the recipient

### Downloading a File

1. Enter the File ID and OTP provided by the sender
2. Click the "Download" button
3. Wait for the download to complete

## Security Features

- Files are stored only in RAM
- OTP verification required for downloads
- Automatic file cleanup after 30 minutes
- No persistent storage on the server

## Technical Details

- Backend: Node.js with Express and Socket.IO
- Frontend: React with Material-UI
- File Transfer: Chunk-based transfer using WebSocket
- Storage: In-memory Map data structure
- Security: OTP verification system

## Limitations

- Files are only available for 30 minutes
- Server restart will clear all stored files
- Memory usage depends on the size and number of files being shared

## License

MIT 