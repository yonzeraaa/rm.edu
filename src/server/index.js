import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { createReadStream, statSync } from 'fs';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import corsOptions from './config/cors.js';
import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';

// Import routes
import createAuthRouter from './routes/auth.js';
import createAdminRouter from './routes/admin.js';
import createCoursesRouter from './routes/courses.js';
import createPublicCoursesRouter from './routes/publicCourses.js';
import createLessonsRouter from './routes/lessons.js';
import createQuizzesRouter from './routes/quizzes.js';
import createStudentRouter from './routes/student.js';
import { authenticateToken, isAdmin } from './middleware.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const app = express();

// Create HTTP server
const server = createServer(app);

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ 
    server,
    path: '/ws'
});

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            console.log('Received:', data);
            
            // Echo back for testing
            ws.send(JSON.stringify({ type: 'response', data: 'Message received' }));
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({ type: 'connection', status: 'connected' }));
});

// Apply CORS configuration with more permissive settings for development
if (process.env.NODE_ENV === 'development') {
    app.use(cors({
        origin: true, // Allow all origins in development
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With']
    }));
} else {
    app.use(cors(corsOptions));
}

app.use(express.json());
app.use(cookieParser());

// Global request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    
    console.log('\n=== Incoming Request ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Method:', req.method);
    console.log('URL:', req.url);
    console.log('Headers:', {
        'host': req.get('host'),
        'origin': req.get('origin'),
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? 'Bearer [TOKEN]' : 'none'
    });
    console.log('Body:', req.method !== 'GET' ? req.body : 'No body (GET request)');
    console.log('Query:', req.query);
    console.log('IP:', req.ip);

    // Log response when it's sent
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        console.log('\n=== Response Sent ===');
        console.log('Status:', res.statusCode);
        console.log('Duration:', duration + 'ms');
        console.log('===================\n');
    });

    next();
});

// Enable pre-flight requests for all routes
app.options('*', cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'Accept', 'Origin', 'X-Requested-With']
}));

// Log uploads path
const uploadsPath = join(__dirname, '../../uploads');
console.log('Uploads path:', uploadsPath);

// Create uploads directories if they don't exist
const createUploadDirs = async () => {
    const dirs = ['uploads', 'uploads/videos', 'uploads/pdfs', 'uploads/images'];
    for (const dir of dirs) {
        const dirPath = join(__dirname, '../../', dir);
        try {
            await fs.access(dirPath);
            console.log('Directory exists:', dir);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            console.log('Directory created:', dir);
        }
    }
};
createUploadDirs();

// Initialize route handlers
const authRouter = createAuthRouter(prisma);
const adminRouter = createAdminRouter(prisma);
const coursesRouter = createCoursesRouter(prisma);
const publicCoursesRouter = createPublicCoursesRouter(prisma);
const lessonsRouter = createLessonsRouter(prisma);
const quizzesRouter = createQuizzesRouter(prisma);
const studentRouter = createStudentRouter(prisma);

// Public routes
app.use('/api/auth', authRouter);
app.use('/api/courses/public', publicCoursesRouter);

// Media streaming handler
const streamMedia = (req, res, filePath, contentType) => {
    try {
        const stat = statSync(filePath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const stream = createReadStream(filePath, { start, end });
            
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType
            });
            
            stream.pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType
            });
            createReadStream(filePath).pipe(res);
        }
    } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).send('Error streaming media');
    }
};

// Protected media routes
app.use('/uploads', authenticateToken, (req, res, next) => {
    const filePath = join(uploadsPath, req.path);
    
    try {
        // Check if file exists
        statSync(filePath);
        
        // Handle different file types
        if (filePath.endsWith('.mp4')) {
            streamMedia(req, res, filePath, 'video/mp4');
        } else if (filePath.endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
            createReadStream(filePath).pipe(res);
        } else if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
            const ext = filePath.split('.').pop().toLowerCase();
            res.setHeader('Content-Type', `image/${ext}`);
            createReadStream(filePath).pipe(res);
        } else {
            next();
        }
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).send('File not found');
        } else {
            console.error('File access error:', error);
            res.status(500).send('Error accessing file');
        }
    }
});

// Protected API routes
app.use('/api/admin', authenticateToken, isAdmin, adminRouter);
app.use('/api/courses', authenticateToken, coursesRouter);
app.use('/api/lessons', authenticateToken, lessonsRouter);
app.use('/api/quizzes', authenticateToken, quizzesRouter);
app.use('/api/student', authenticateToken, studentRouter);

// Serve static files from dist directory
app.use(express.static(join(__dirname, '../../dist')));

// Handle all other routes for SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../../dist/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        headers: req.headers
    });
    
    res.status(500).json({ 
        error: 'Erro interno do servidor',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Force port 3001 and bind to all interfaces
const PORT = 3001;
const HOST = '0.0.0.0';

// Create server with explicit error handling
server.listen(PORT, HOST, () => {
    console.log(`\n=== Server Started ===`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Server bound to all network interfaces (${HOST})`);
    console.log(`Local access: http://localhost:${PORT}`);
    console.log(`Network access: http://<your-ip>:${PORT}`);
    console.log(`WebSocket server running on ws://<your-ip>:${PORT}/ws`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`===================\n`);
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`\nError: Port ${PORT} is already in use`);
        console.error('Please ensure no other process is using this port');
        console.error('You can check this using: netstat -ano | findstr :3001');
    } else {
        console.error('Server error:', error);
    }
    process.exit(1);
});

// Increase server timeout
server.timeout = 120000; // 2 minutes
server.keepAliveTimeout = 120000; // 2 minutes

// Handle process termination
process.on('SIGTERM', () => {
    console.log('Received SIGTERM signal. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('Received SIGINT signal. Closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
