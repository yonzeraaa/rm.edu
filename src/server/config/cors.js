import cors from 'cors';

// Get the external IP from environment or fallback
const EXTERNAL_IP = process.env.EXTERNAL_IP || '187.67.178.233';

const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('Allowing request with no origin');
      return callback(null, true);
    }

    // Log the origin check
    console.log('CORS Origin Check:', {
      requestOrigin: origin,
      externalIP: EXTERNAL_IP,
      env: process.env.NODE_ENV
    });

    // Always allow if it's the external IP (with any port)
    if (origin.includes(EXTERNAL_IP)) {
      console.log('CORS: Allowing external IP access:', origin);
      return callback(null, true);
    }

    // Allow local development URLs
    const localPatterns = [
      /^http:\/\/localhost(:\d+)?$/,
      /^http:\/\/127\.0\.0\.1(:\d+)?$/,
      /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/,
      /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/
    ];

    // Check if origin matches any local pattern
    const isLocalAccess = localPatterns.some(pattern => pattern.test(origin));
    if (isLocalAccess) {
      console.log('CORS: Allowing local access:', origin);
      return callback(null, true);
    }

    // In development, allow all origins
    if (process.env.NODE_ENV === 'development') {
      console.log('CORS: Development mode - allowing all origins');
      return callback(null, true);
    }

    // If none of the above conditions match, reject the request
    console.warn('CORS: Origin rejected:', origin);
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  
  // Allowed HTTP methods
  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'OPTIONS',
    'PATCH'
  ],
  
  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Range',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Cache-Control',
    'If-None-Match'
  ],
  
  // Headers exposed to the client
  exposedHeaders: [
    'Content-Range',
    'Accept-Ranges',
    'Content-Length',
    'Content-Type',
    'ETag',
    'Last-Modified'
  ],
  
  // Allow credentials (cookies, authorization headers)
  credentials: true,
  
  // Cache preflight requests for 24 hours
  maxAge: 86400,
  
  // Don't pass OPTIONS requests to the handler
  preflightContinue: false,
  
  // Success status code for OPTIONS requests
  optionsSuccessStatus: 204
};

// Create middleware with options
const corsMiddleware = cors(corsOptions);

// Export both the options and middleware
export { corsOptions as default, corsMiddleware };
