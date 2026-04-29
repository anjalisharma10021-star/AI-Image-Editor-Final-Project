$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$port/")
try {
    $listener.Start()
    Write-Host "Server started! Open this link on your phone (must be on the same Wi-Fi):" -ForegroundColor Green
    
    # Get local IP
    $ip = (Test-Connection -ComputerName (hostname) -Count 1).IPv4Address.IPAddressToString
    if (-not $ip) {
        $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias Wi-Fi).IPAddress
    }
    
    Write-Host "http://$($ip):$port/" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server."
    
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localFilePath = "." + $request.Url.LocalPath.Replace("/", "\")
        if ($localFilePath -eq ".\") { $localFilePath = ".\index.html" }
        
        if (Test-Path $localFilePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($localFilePath)
            $response.ContentLength64 = $content.Length
            
            if ($localFilePath.EndsWith(".html")) { $response.ContentType = "text/html" }
            elseif ($localFilePath.EndsWith(".css")) { $response.ContentType = "text/css" }
            elseif ($localFilePath.EndsWith(".js")) { $response.ContentType = "application/javascript" }
            
            $output = $response.OutputStream
            $output.Write($content, 0, $content.Length)
            $output.Close()
        } else {
            $response.StatusCode = 404
            $response.Close()
        }
    }
} catch {
    Write-Host "Failed to start server. Try running PowerShell as Administrator, or the port may be in use." -ForegroundColor Red
    Write-Host $_.Exception.Message
} finally {
    if ($listener.IsListening) {
        $listener.Stop()
    }
}
