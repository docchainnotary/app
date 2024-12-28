const express = require('express');
const https = require('https');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// SSL/TLS Certificate configuration
const certPath = '/etc/letsencrypt/live/api.docchainnotary.com/';
const credentials = {
    key: fs.readFileSync(path.join(certPath, 'privkey.pem')),
    cert: fs.readFileSync(path.join(certPath, 'fullchain.pem')),
    ca: fs.readFileSync(path.join(certPath, 'chain.pem'))
};

const app = express();
const server = https.createServer(credentials, app);

// Update CORS to be more specific for production
const io = new Server(server, {
    cors: {
        origin: "https://app.docchainnotary.com",  // Your main website
        methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
});

// Enable security headers
app.use((req, res, next) => {
    // HSTS (HTTP Strict Transport Security)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Disable MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Referrer policy
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    next();
});

// Store active rooms and their participants
const rooms = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});
// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    function joinRoom(roomId) {
        console.log(`Join requested for room: ${roomId}`);
        
        // Check if room exists
        if (!rooms.has(roomId)) {
            socket.emit('error', { message: 'Room does not exist' });
            return;
        }

        const room = rooms.get(roomId);
        
        // Check if room is full
        if (room.size >= 2) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        // Join room
        socket.join(roomId);
        room.add(socket.id);
        socket.emit('joined', { roomId });
        socket.to(roomId).emit('peer-joined', { peerId: socket.id });
        
        console.log(`Client ${socket.id} joined room: ${roomId}`);
    }

    // Handle room creation
    socket.on('create', (roomId) => {
        console.log(`Room creation requested: ${roomId}`);
        
        // Check if room already exists
        if (rooms.has(roomId)) {
            console.log(`Room already exists. Forwarding over there...`);
            return;
        }

        // Create new room and join it
        socket.join(roomId);
        rooms.set(roomId, new Set([socket.id]));
        socket.emit('created', { roomId });
        
        console.log(`Room created: ${roomId}`);
    });

    // Handle room joining
    socket.on('join', (roomId)=>joinRoom(roomId));

    // Handle WebRTC signaling
    socket.on('offer', (data) => {
        console.log(`Offer received from ${socket.id} for room ${data.room}`);
        socket.to(data.room).emit('offer', {
            sdp: data.sdp,
            room: data.room
        });
    });

    socket.on('answer', (data) => {
        console.log(`Answer received from ${socket.id} for room ${data.room}`);
        socket.to(data.room).emit('answer', {
            sdp: data.sdp,
            room: data.room
        });
    });

    socket.on('ice-candidate', (data) => {
        console.log(`ICE candidate received from ${socket.id} for room ${data.room}`);
        socket.to(data.room).emit('ice-candidate', {
            candidate: data.candidate,
            room: data.room
        });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Clean up rooms
        for (const [roomId, participants] of rooms.entries()) {
            if (participants.has(socket.id)) {
                participants.delete(socket.id);
                
                // Notify other participants
                socket.to(roomId).emit('peer-disconnected', { peerId: socket.id });
                
                // Remove empty rooms
                if (participants.size === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted`);
                }
            }
        }
    });

    // Handle explicit hangup
    socket.on('hangup', (roomId) => {
        console.log(`Hangup received from ${socket.id} for room ${roomId}`);
        
        if (rooms.has(roomId)) {
            const participants = rooms.get(roomId);
            participants.delete(socket.id);
            
            // Notify other participants
            socket.to(roomId).emit('peer-disconnected', { peerId: socket.id });
            
            // Remove empty rooms
            if (participants.size === 0) {
                rooms.delete(roomId);
                console.log(`Room ${roomId} deleted`);
            }
        }
        
        socket.leave(roomId);
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        rooms: rooms.size,
        secure: req.secure,
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 8443;
server.listen(PORT, () => {
    console.log(`Secure signaling server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Perform cleanup if necessary
    process.exit(1);
});
