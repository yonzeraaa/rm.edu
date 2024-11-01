import net from 'net';
import http from 'http';
import { networkInterfaces } from 'os';
import https from 'https';

const PORTS = [
  { port: 3001, name: 'Server' },
  { port: 8082, name: 'Client' }
];
const TIMEOUT = 5000;

// Get external IP dynamically
async function getExternalIP() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.ipify.org',
      port: 443,
      path: '/',
      method: 'GET'
    };

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
}

function getLocalIP() {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

async function checkPort(port, host) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let status = false;

    socket.setTimeout(TIMEOUT);

    socket.on('connect', () => {
      status = true;
      socket.destroy();
    });

    socket.on('timeout', () => {
      socket.destroy();
    });

    socket.on('error', (error) => {
      console.log(`Port ${port} check error on ${host}:`, error.message);
    });

    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}

async function checkHttpEndpoint(port, host) {
  return new Promise((resolve) => {
    const url = `http://${host}:${port}`;
    const req = http.get(url, (res) => {
      resolve(true);
      res.resume();
    });

    req.on('error', (error) => {
      console.log(`HTTP check error for ${url}:`, error.message);
      resolve(false);
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function runTests() {
  const localIP = getLocalIP();
  const externalIP = await getExternalIP();
  
  console.log('\nStarting comprehensive network test...');
  console.log('=====================================');
  console.log('Local IP:', localIP);
  console.log('External IP:', externalIP);
  console.log('=====================================\n');

  // Test local ports
  console.log('Testing localhost connections...');
  for (const { port, name } of PORTS) {
    const isLocalOpen = await checkPort(port, 'localhost');
    console.log(`${name} port ${port} on localhost: ${isLocalOpen ? '✓ OPEN' : '✗ CLOSED'}`);
    
    if (isLocalOpen) {
      const httpStatus = await checkHttpEndpoint(port, 'localhost');
      console.log(`${name} HTTP endpoint on localhost: ${httpStatus ? '✓ RESPONDING' : '✗ NOT RESPONDING'}`);
    }
  }

  console.log('\nTesting local IP connections...');
  for (const { port, name } of PORTS) {
    const isLocalIPOpen = await checkPort(port, localIP);
    console.log(`${name} port ${port} on ${localIP}: ${isLocalIPOpen ? '✓ OPEN' : '✗ CLOSED'}`);
    
    if (isLocalIPOpen) {
      const httpStatus = await checkHttpEndpoint(port, localIP);
      console.log(`${name} HTTP endpoint on ${localIP}: ${httpStatus ? '✓ RESPONDING' : '✗ NOT RESPONDING'}`);
    }
  }

  console.log('\nTesting external IP connections...');
  for (const { port, name } of PORTS) {
    const isExternalOpen = await checkPort(port, externalIP);
    console.log(`${name} port ${port} on ${externalIP}: ${isExternalOpen ? '✓ OPEN' : '✗ CLOSED'}`);
    
    if (isExternalOpen) {
      const httpStatus = await checkHttpEndpoint(port, externalIP);
      console.log(`${name} HTTP endpoint on ${externalIP}: ${httpStatus ? '✓ RESPONDING' : '✗ NOT RESPONDING'}`);
    }
  }

  console.log('\nNetwork Test Summary:');
  console.log('===================');
  console.log('If any ports are showing as CLOSED or NOT RESPONDING, check:');
  console.log('1. Windows Firewall settings (run setup:firewall again)');
  console.log('2. UPnP port forwarding status (check router settings)');
  console.log('3. Server and client application status');
  console.log('4. Any security software that might be blocking connections');
  console.log('\nFor external access to work:');
  console.log('- Both ports must be OPEN');
  console.log('- HTTP endpoints should be RESPONDING');
  console.log('- UPnP must be properly configured');
  console.log('- No security software should be blocking the connections');
}

console.log('Starting comprehensive network test...');
runTests().catch(console.error);
