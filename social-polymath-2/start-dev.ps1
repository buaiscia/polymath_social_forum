# Start the backend server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run server"

# Wait a moment for the server to start
Start-Sleep -Seconds 2

# Start the frontend dev server in another new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"

Write-Host "Starting both server and dev environments..."
Write-Host "Server will run on one terminal, dev on another"
