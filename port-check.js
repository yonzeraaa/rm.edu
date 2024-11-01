import net from 'net';
import { networkInterfaces } from 'os';

const EXTERNAL_IP = '187.67.178.233';
const PORTS = [8082, 8081];
const TIMEOUT = 5000;

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
      console.log(`Port ${port} check error:`, error.message);
    });

    socket.on('close', () => {
      resolve(status);
    });

    socket.connect(port, host);
  });
}

async function runTests() {
  const localIP = getLocalIP();
  console.log('\nStarting port accessibility tests...');
  console.log('--------------------------------');
  console.log('Local IP:', localIP);
  console.log('External IP:', EXTERNAL_IP);
  console.log('--------------------------------\n');

  // Test local ports
  console.log('Testing local ports...');
  for (const port of PORTS) {
    const isLocalOpen = await checkPort(port, 'localhost');
    console.log(`Port ${port} on localhost: ${isLocalOpen ? 'OPEN' : 'CLOSED'}`);
  }

  console.log('\nTesting local IP ports...');
  for (const port of PORTS) {
    const isLocalIPOpen = await checkPort(port, localIP);
    console.log(`Port ${port} on ${localIP}: ${isLocalIPOpen ? 'OPEN' : 'CLOSED'}`);
  }

  console.log('\nTesting external IP ports...');
  for (const port of PORTS) {
    const isExternalOpen = await checkPort(port, EXTERNAL_IP);
    console.log(`Port ${port} on ${EXTERNAL_IP}: ${isExternalOpen ? 'OPEN' : 'CLOSED'}`);
  }

  console.log('\nPort Test Summary:');
  console.log('----------------');
  console.log('If any ports are showing as CLOSED, please check:');
  console.log('1. Your firewall settings');
  console.log('2. UPnP port forwarding status');
  console.log('3. Router configuration');
  console.log('4. Any security software that might be blocking connections');
  console.log('\nFor external access to work, all ports must be OPEN');
}

console.log('Starting port accessibility check...');
runTests().catch(console.error);
