# Pause pour que le serveur ait le temps de démarrer
Start-Sleep -Seconds 5

# Vérification du code HTTP
try {
    $response = Invoke-WebRequest -Uri http://localhost:3000/ -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "SMOKE TEST PASSED"
        exit 0
    } else {
        Write-Host "SMOKE TEST FAILED"
        exit 1
    }
} catch {
    Write-Host "SMOKE TEST FAILED"
    exit 1
}
