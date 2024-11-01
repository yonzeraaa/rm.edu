import { setupPortForwarding, removePortForwarding } from './src/utils/upnp.js';
import { spawn } from 'child_process';

const MAX_SETUP_ATTEMPTS = 3;
const SETUP_RETRY_DELAY = 5000; // 5 seconds

async function startServer() {
    console.log('\nStarting server...');
    const serverProcess = spawn('node', ['src/server/index.js'], {
        env: { ...process.env, PORT: '3001', HOST: '0.0.0.0' },
        stdio: 'inherit'
    });

    serverProcess.on('error', (error) => {
        console.error('Failed to start server:', error);
    });

    return serverProcess;
}

async function attemptSetup(attempt = 1) {
    try {
        console.log(`\nAttempting UPnP setup (Attempt ${attempt}/${MAX_SETUP_ATTEMPTS})...`);
        
        // Remove any existing port mappings first
        try {
            await removePortForwarding();
            console.log('Successfully removed existing port mappings');
        } catch (error) {
            console.warn('Warning: Failed to remove existing port mappings:', error.message);
        }

        // Wait a bit before setting up new mappings
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Attempt the port forwarding setup
        const result = await setupPortForwarding();
        
        console.log('\nPort forwarding setup successful!');
        console.log('\nNetwork Configuration:');
        console.log('----------------------');
        console.log('Local IP:', result.localIp);
        console.log('External IP:', result.externalIp);
        console.log('Client Port:', result.clientPort);
        console.log('Server Port:', result.serverPort);
        
        console.log('\nAccess URLs:');
        console.log('------------');
        console.log('Application:', `http://${result.externalIp}:${result.clientPort}`);
        console.log('API:', `http://${result.externalIp}:${result.serverPort}`);
        console.log('WebSocket:', `ws://${result.externalIp}:8082`);
        
        // Set environment variables for other processes
        process.env.EXTERNAL_IP = result.externalIp;
        process.env.CLIENT_PORT = result.clientPort.toString();
        process.env.SERVER_PORT = result.serverPort.toString();

        // Start the server after successful port forwarding
        const serverProcess = await startServer();
        
        return { success: true, serverProcess };
    } catch (error) {
        console.error(`\nSetup attempt ${attempt} failed:`, error.message);
        
        if (attempt < MAX_SETUP_ATTEMPTS) {
            console.log(`\nRetrying in ${SETUP_RETRY_DELAY/1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, SETUP_RETRY_DELAY));
            return attemptSetup(attempt + 1);
        } else {
            console.error('\nFailed to setup port forwarding after maximum attempts');
            throw error;
        }
    }
}

// Handle cleanup
async function cleanup(serverProcess) {
    console.log('\nCleaning up...');
    
    if (serverProcess) {
        console.log('Stopping server...');
        serverProcess.kill();
    }
    
    console.log('Removing port forwarding...');
    try {
        await removePortForwarding();
        console.log('Cleanup completed successfully');
    } catch (error) {
        console.error('Error during cleanup:', error.message);
    }
    process.exit();
}

// Set up cleanup handlers
let currentServerProcess = null;

process.on('SIGINT', () => cleanup(currentServerProcess));
process.on('SIGTERM', () => cleanup(currentServerProcess));
process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await cleanup(currentServerProcess);
});
process.on('unhandledRejection', async (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    await cleanup(currentServerProcess);
});

// Start the setup process
console.log('Starting UPnP port forwarding setup...');

try {
    const { serverProcess } = await attemptSetup();
    currentServerProcess = serverProcess;
    console.log('\nSetup completed successfully. Server is running...');
} catch (error) {
    console.error('\nFatal error:', error.message);
    console.error('Could not setup port forwarding. Please check your network configuration.');
    process.exit(1);
}
