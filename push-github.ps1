param(
  [string]$Message = "Update bookkeeping notes $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Run-Git {
  & git @args
  if ($LASTEXITCODE -ne 0) {
    throw "Git command failed: git $($args -join ' ')"
  }
}

Write-Host "Checking changes..."
Run-Git diff --check

if (Test-Path "server.js") {
  & node --check server.js
  if ($LASTEXITCODE -ne 0) { throw "server.js syntax check failed." }
}
if (Test-Path "public\app.js") {
  & node --check public\app.js
  if ($LASTEXITCODE -ne 0) { throw "public/app.js syntax check failed." }
}

Write-Host "Staging changes (excluding data folders)..."
Run-Git add --all -- .

$stagedDataFiles = & git diff --cached --name-only -- datas data
if ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect staged data files."
}
if ($stagedDataFiles) {
  & git restore --staged -- datas data
  throw "Refusing to commit data files: $($stagedDataFiles -join ', ')"
}

& git diff --cached --quiet
if ($LASTEXITCODE -eq 1) {
  Write-Host "Creating commit: $Message"
  Run-Git commit -m $Message
} elseif ($LASTEXITCODE -ne 0) {
  throw "Unable to inspect staged changes."
} else {
  Write-Host "No new changes to commit. Pushing existing commits."
}

$proxy = "http://127.0.0.1:7897"
$githubUser = "bhcgdh"
$proxyListening = Get-NetTCPConnection -State Listen -LocalPort 7897 -ErrorAction SilentlyContinue
if (-not $proxyListening) {
  throw "Local GitHub proxy is not listening on 127.0.0.1:7897."
}

Write-Host "Pushing through local proxy..."
$env:GCM_INTERACTIVE = "Never"
Run-Git -c "credential.username=$githubUser" -c "credential.interactive=never" -c "http.proxy=$proxy" -c "https.proxy=$proxy" push origin main

Write-Host "Push completed."
Run-Git status -sb
Run-Git log -1 --oneline --decorate
