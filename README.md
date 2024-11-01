# Educational Platform

## External Access Setup

To enable external access to the development server, follow these steps:

1. First, run the following command as Administrator to set up firewall rules:
```powershell
npm run setup:firewall
```

2. Then start the development server with external access enabled:
```bash
npm run dev:external
```

This will:
- Check port accessibility
- Configure UPnP port forwarding
- Start both the API server and development server

The application should be accessible at:
- Local: http://localhost:8082
- External: http://187.67.178.233:8082
- API: http://187.67.178.233:3001

### Troubleshooting External Access

If you cannot access the application externally:

1. Check if ports are open:
```bash
npm run check:ports
```

2. Verify firewall rules are properly set:
```powershell
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*Educational Platform*" }
```

3. Make sure UPnP is enabled on your router

4. If using Windows Defender or other security software, ensure it's not blocking the connections

### Port Usage

The application uses the following ports:
- 8082: Development server (HTTP and WebSocket)
- 3001: API server

Both TCP and UDP protocols are configured for WebSocket support.
