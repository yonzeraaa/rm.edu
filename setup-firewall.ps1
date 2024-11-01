# Run as administrator
if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Warning "Please run this script as Administrator!"
    Break
}

$clientPort = 8082
$serverPort = 3001
$appName = "Educational Platform"

Write-Host "Setting up Windows Firewall rules for $appName..."
Write-Host "This will configure both TCP and UDP rules for ports $serverPort (server) and $clientPort (client)"

# Function to test if a port is in use
function Test-PortInUse {
    param($port)
    $connections = netstat -ano | Select-String "TCP.*:$port.*LISTENING"
    if ($connections) {
        $processId = $connections.Line.Split(' ')[-1]
        $process = Get-Process -Id $processId
        return @{
            InUse = $true
            ProcessName = $process.ProcessName
            ProcessId = $processId
        }
    }
    return @{
        InUse = $false
    }
}

# Check if ports are in use
$serverPortStatus = Test-PortInUse -port $serverPort
$clientPortStatus = Test-PortInUse -port $clientPort

if ($serverPortStatus.InUse) {
    Write-Warning "Port $serverPort is currently in use by process $($serverPortStatus.ProcessName) (PID: $($serverPortStatus.ProcessId))"
    $response = Read-Host "Would you like to kill this process? (y/n)"
    if ($response -eq 'y') {
        Stop-Process -Id $serverPortStatus.ProcessId -Force
        Write-Host "Process killed successfully"
    } else {
        Write-Warning "Port $serverPort may not be available for the application"
    }
}

# Remove existing rules
Write-Host "`nRemoving existing firewall rules..."
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*$appName*" } | Remove-NetFirewallRule
Write-Host "Existing rules removed successfully"

# Create new rules with enhanced logging
Write-Host "`nCreating new firewall rules..."

# Server Rules (3001)
$rules = @(
    @{
        DisplayName = "$appName Server TCP In"
        Direction = "Inbound"
        LocalPort = $serverPort
        Protocol = "TCP"
        Description = "Allow incoming TCP connections for Educational Platform server"
    },
    @{
        DisplayName = "$appName Server TCP Out"
        Direction = "Outbound"
        LocalPort = $serverPort
        Protocol = "TCP"
        Description = "Allow outgoing TCP connections for Educational Platform server"
    },
    # Client Rules (8082)
    @{
        DisplayName = "$appName Client TCP In"
        Direction = "Inbound"
        LocalPort = $clientPort
        Protocol = "TCP"
        Description = "Allow incoming TCP connections for Educational Platform client"
    },
    @{
        DisplayName = "$appName Client TCP Out"
        Direction = "Outbound"
        LocalPort = $clientPort
        Protocol = "TCP"
        Description = "Allow outgoing TCP connections for Educational Platform client"
    }
)

foreach ($rule in $rules) {
    try {
        New-NetFirewallRule -DisplayName $rule.DisplayName `
            -Direction $rule.Direction `
            -LocalPort $rule.LocalPort `
            -Protocol $rule.Protocol `
            -Action Allow `
            -Profile Any `
            -Program "Any" `
            -Description $rule.Description `
            -Enabled True

        Write-Host "Created rule: $($rule.DisplayName)" -ForegroundColor Green
    }
    catch {
        Write-Host "Error creating rule: $($rule.DisplayName)" -ForegroundColor Red
        Write-Host $_.Exception.Message
    }
}

# Verify rules
Write-Host "`nVerifying firewall rules..."
$verificationRules = Get-NetFirewallRule | Where-Object { $_.DisplayName -like "*$appName*" }
$verificationRules | Select-Object DisplayName, Enabled, Direction, Action | Format-Table -AutoSize

# Test port accessibility
Write-Host "`nTesting port accessibility..."
$testPorts = @($serverPort, $clientPort)
foreach ($port in $testPorts) {
    $testResult = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
    if ($testResult.TcpTestSucceeded) {
        Write-Host "Port $port is accessible" -ForegroundColor Green
    } else {
        Write-Host "Port $port is not accessible" -ForegroundColor Yellow
        Write-Host "This is normal if no application is currently listening on this port"
    }
}

Write-Host "`nFirewall configuration complete!"
Write-Host "Summary:"
Write-Host "- Server port $serverPort configured for TCP"
Write-Host "- Client port $clientPort configured for TCP"
Write-Host "- All rules are enabled for all network profiles"

Write-Host "`nNext steps:"
Write-Host "1. Start the server application"
Write-Host "2. Run 'netstat -ano | findstr :$serverPort' to verify the server is listening"
Write-Host "3. Test connectivity using 'Test-NetConnection localhost -Port $serverPort'"

Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
