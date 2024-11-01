import { exec } from 'child_process';
import { promisify } from 'util';
import { setupPortForwarding } from './upnp.js';

const execAsync = promisify(exec);

async function killProcessOnPort(port) {
    try {
        // For Windows
        await execAsync(`netstat -ano | findstr :${port}`).then(async ({ stdout }) => {
            const lines = stdout.split('\n');
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && /^\d+$/.test(pid)) {
                    console.log(`Killing process ${pid} on port ${port}`);
                    await execAsync(`taskkill /F /PID ${pid}`);
                }
            }
        });
    } catch (error) {
        // If no process found or other error, continue
        console.log(`No process found on port ${port} or error occurred:`, error.message);
    }
}

async function startServer() {
    try {
        // Kill any existing process on port 3001
        await killProcessOnPort(3001);
        
        // Setup port forwarding
        await setupPortForwarding();
        
        // Start the server
        console.log('Starting server...');
        const serverProcess = exec('node src/server/index.js', (error, stdout, stderr) => {
            if (error) {
                console.error('Server error:', error);
                return;
            }
            console.log(stdout);
            console.error(stderr);
        });

        serverProcess.stdout.on('data', (data) => {
            console.log(data.toString());
        });

        serverProcess.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        // Handle process termination
        process.on('SIGINT', () => {
            serverProcess.kill();
            process.exit();
        });

        process.on('SIGTERM', () => {
            serverProcess.kill();
            process.exit();
        });

    } catch (error) {
        console.error('Error during server startup:', error);
        process.exit(1);
    }
}

startServer();
