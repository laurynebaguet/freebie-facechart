# Petit serveur web local, pour tester l'application sur cette machine.
# Lancement : clic droit sur ce fichier > "Executer avec PowerShell"
# ou :        powershell -ExecutionPolicy Bypass -File outils\serveur-local.ps1
# Puis ouvrir http://localhost:8080 dans le navigateur. Ctrl+C pour arreter.

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$port = 8080

$types = @{
  '.html'='text/html; charset=utf-8'; '.js'='text/javascript; charset=utf-8';
  '.css'='text/css; charset=utf-8';   '.json'='application/json; charset=utf-8';
  '.svg'='image/svg+xml';  '.png'='image/png';  '.jpg'='image/jpeg';
  '.jpeg'='image/jpeg';    '.webp'='image/webp'; '.gif'='image/gif';
  '.woff2'='font/woff2';   '.txt'='text/plain; charset=utf-8';
  '.ico'='image/x-icon';   '.md'='text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host ""
Write-Host "  Serveur demarre  ->  http://localhost:$port" -ForegroundColor Green
Write-Host "  Dossier servi    :  $root"
Write-Host "  Ctrl+C pour arreter."
Write-Host ""

try {
  while ($listener.IsListening) {
    $ctx = $listener.GetContext()
    $rel = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath).TrimStart('/')
    if ($rel -eq '') { $rel = 'index.html' }
    $path = Join-Path $root $rel
    if ((Test-Path $path -PathType Container)) { $path = Join-Path $path 'index.html' }

    if (Test-Path $path -PathType Leaf) {
      $ext = [IO.Path]::GetExtension($path).ToLower()
      $ctx.Response.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
      $ctx.Response.Headers.Add('Cache-Control', 'no-store')
      $bytes = [IO.File]::ReadAllBytes($path)
      $ctx.Response.ContentLength64 = $bytes.Length
      $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
      Write-Host ("  200  /" + $rel)
    } else {
      $ctx.Response.StatusCode = 404
      $msg = [Text.Encoding]::UTF8.GetBytes("404 - introuvable : $rel")
      $ctx.Response.OutputStream.Write($msg, 0, $msg.Length)
      Write-Host ("  404  /" + $rel) -ForegroundColor DarkYellow
    }
    $ctx.Response.Close()
  }
} finally {
  $listener.Stop(); $listener.Close()
}
