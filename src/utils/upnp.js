import natAPI from 'nat-api';
import { networkInterfaces } from 'os';
import https from 'https';

// Constants
const CLIENT_PORT = 8082;
const SERVER_PORT = 3001;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to delay between retries
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to get external IP
const getExternalIP = async () => {
  const options = {
    hostname: 'api.ipify.org',
    port: 443,
    path: '/',
    method: 'GET'
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data.trim());
      });
    });

    req.on('error', error => {
      console.error('Error fetching external IP:', error);
      reject(error);
    });

    req.end();
  });
};

// Helper function to get local IP
const getLocalIP = () => {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
};

// Helper function to create a new NAT client
const createNatClient = (externalIp) => {
  return new natAPI({
    ttl: 0, // Permanent mapping
    description: 'Educational Platform',
    gateway: undefined, // Auto-discover gateway
    timeout: 20000, // 20 seconds timeout
    publicIp: externalIp // Use detected external IP
  });
};

// Helper function to setup a single port mapping with retries
const setupPortMapping = async (nat, port, description, externalIp, protocols = ['TCP', 'UDP']) => {
  for (const protocol of protocols) {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Attempting to map port ${port} (${protocol}) (Attempt ${attempt})`);
        
        // Force remove any existing mapping first
        try {
          await nat.unmap({
            publicPort: port,
            protocol: protocol
          });
          console.log(`Removed existing mapping for port ${port} (${protocol})`);
          await delay(1000); // Wait a bit before creating new mapping
        } catch (error) {
          console.warn(`No existing mapping found for port ${port} (${protocol})`);
        }

        // Create new mapping
        await nat.map({
          publicPort: port,
          privatePort: port,
          protocol: protocol,
          description: `${description} (${protocol})`,
          ttl: 0,
          public: externalIp
        });

        console.log(`Successfully mapped port ${port} (${protocol})`);
        break;
      } catch (error) {
        console.warn(`Attempt ${attempt} failed for port ${port} (${protocol}):`, error.message);
        if (attempt === MAX_RETRIES) {
          console.error(`Failed to map port ${port} (${protocol}) after ${MAX_RETRIES} attempts`);
          if (protocol === 'TCP') {
            throw error; // Only throw for TCP failures
          }
        } else {
          console.log(`Waiting ${RETRY_DELAY * attempt}ms before retry...`);
          await delay(RETRY_DELAY * attempt); // Exponential backoff
        }
      }
    }
  }
};

export const setupPortForwarding = async () => {
  let nat = null;
  try {
    console.log('Starting port forwarding setup...');
    
    // Get external IP automatically
    const externalIp = await getExternalIP();
    console.log('Detected external IP:', externalIp);
    
    console.log('Local IP:', getLocalIP());
    console.log('Ports to forward:', { 
      server: SERVER_PORT,
      client: CLIENT_PORT
    });

    // Create new NAT client with detected IP
    nat = createNatClient(externalIp);
    console.log('NAT client created');

    // Remove any existing mappings first
    console.log('Removing existing port mappings...');
    try {
      await removePortForwarding(externalIp);
      await delay(2000); // Wait longer for mappings to clear
      console.log('Existing mappings removed');
    } catch (error) {
      console.warn('Error clearing existing mappings:', error.message);
    }

    // Create new NAT client for mapping
    nat = createNatClient(externalIp);
    console.log('Created fresh NAT client for mapping');

    // Setup server port (3001) first
    console.log('Setting up server port forwarding...');
    await setupPortMapping(nat, SERVER_PORT, 'Educational Platform Server', externalIp, ['TCP']);
    console.log('Server port forwarding configured');
    
    await delay(2000); // Wait between port setups

    // Setup client port (8082) for both HTTP and WebSocket
    console.log('Setting up client port forwarding...');
    await setupPortMapping(nat, CLIENT_PORT, 'Educational Platform Client', externalIp, ['TCP', 'UDP']);
    console.log('Client port forwarding configured');

    // Store configuration
    process.env.EXTERNAL_IP = externalIp;
    process.env.CLIENT_PORT = CLIENT_PORT.toString();
    process.env.SERVER_PORT = SERVER_PORT.toString();

    console.log('Port forwarding setup complete');
    console.log(`Application should be accessible at http://${externalIp}:${CLIENT_PORT}`);
    console.log(`API should be accessible at http://${externalIp}:${SERVER_PORT}`);

    return {
      externalIp: externalIp,
      clientPort: CLIENT_PORT,
      serverPort: SERVER_PORT,
      localIp: getLocalIP()
    };
  } catch (error) {
    console.error('Fatal error setting up port forwarding:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw new Error(`Port forwarding failed: ${error.message}`);
  }
};

export const removePortForwarding = async (externalIp) => {
  let nat = null;
  try {
    nat = createNatClient(externalIp);
    const ports = [SERVER_PORT, CLIENT_PORT];
    const protocols = ['TCP', 'UDP'];
    
    for (const port of ports) {
      for (const protocol of protocols) {
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            await nat.unmap({
              publicPort: port,
              protocol: protocol
            });
            console.log(`Successfully removed mapping for port ${port} (${protocol})`);
            break;
          } catch (error) {
            console.warn(`Attempt ${attempt} to remove port ${port} (${protocol}) failed:`, error.message);
            if (attempt === MAX_RETRIES) {
              console.error(`Failed to remove mapping for port ${port} (${protocol}) after ${MAX_RETRIES} attempts`);
            } else {
              await delay(RETRY_DELAY * attempt);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error removing port forwarding:', error);
  } finally {
    if (nat) {
      try {
        await nat.destroy();
        console.log('NAT client destroyed successfully');
      } catch (error) {
        console.error('Error destroying NAT client:', error);
      }
    }
  }
};

// Handle cleanup on process exit
process.on('SIGINT', async () => {
  console.log('Received SIGINT signal, cleaning up...');
  const externalIp = await getExternalIP();
  await removePortForwarding(externalIp);
  process.exit();
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  const externalIp = await getExternalIP();
  await removePortForwarding(externalIp);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  const externalIp = await getExternalIP();
  await removePortForwarding(externalIp);
  process.exit(1);
});
