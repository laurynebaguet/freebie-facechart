# Prepare un visage pour l'application.
#
# Tes dessins en haute resolution vont dans   images/visages/originaux/
# Cet outil en sort une copie allegee dans    images/visages/
# et affiche les chiffres a recopier dans     app/donnees.js
#
# Lancement : clic droit sur ce fichier > "Executer avec PowerShell"
# ou :        powershell -ExecutionPolicy Bypass -File outils\reduire-visage.ps1
#
# Pourquoi : un dessin d'impression fait 3 a 4 Mo. L'application charge TOUS
# les visages au demarrage, donc chaque megaoctet retarde l'ouverture de la
# page pour tout le monde. 1400 pixels de large suffisent : c'est plus que ce
# que la fiche PDF consomme (1100) et que le plus grand ecran affiche.

param(
  # Un seul original a traiter, par son nom de fichier. Par defaut : tous ceux
  # qui se trouvent dans images/visages/originaux/.
  [string] $Fichier = '',
  # Nom du fichier produit, sans extension : mets l'identifiant du visage
  # ("lou"). Reserve au traitement d'un seul fichier a la fois.
  [string] $Id = '',
  [int]    $LargeurMax = 1400,
  # Force le PNG sans perte. Ne sert que si un dessin doit garder sa
  # transparence ; sinon le JPEG est quatre a cinq fois plus leger sans
  # difference visible (voir plus bas).
  [switch] $Png
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

# Qualite JPEG. 92 est le point ou l'on cesse de gagner en finesse tout en
# continuant a payer : de 82 a 96, le poids double et l'ecart avec l'original
# ne bouge presque pas.
$QUALITE = 92

$racine    = Split-Path -Parent $PSScriptRoot
$visages   = Join-Path $racine 'images\visages'
$originaux = Join-Path $visages 'originaux'
if (-not (Test-Path $originaux)) { New-Item -ItemType Directory -Path $originaux | Out-Null }

$sources = Get-ChildItem $originaux -File |
           Where-Object { $_.Extension -match '^\.(png|jpg|jpeg)$' }
if ($Fichier) { $sources = $sources | Where-Object { $_.Name -eq $Fichier } }

if (-not $sources) {
  Write-Host ""
  Write-Host "  Rien a traiter." -ForegroundColor Yellow
  Write-Host "  Depose tes dessins en haute resolution dans :"
  Write-Host "    images\visages\originaux\"
  Write-Host ""
  return
}
if ($Id -and @($sources).Count -gt 1) {
  throw "-Id ne vaut que pour un seul fichier : ajoute -Fichier <nom du fichier>."
}

foreach ($src in $sources) {
  Write-Host ""
  Write-Host ("  " + $src.Name) -ForegroundColor Green

  $img = [System.Drawing.Image]::FromFile($src.FullName)
  try {
    # --- 1. Reduire
    # Une image deja assez petite n'est pas agrandie : le facteur plafonne a 1.
    $facteur = [math]::Min(1.0, $LargeurMax / $img.Width)
    $w = [int][math]::Round($img.Width  * $facteur)
    $h = [int][math]::Round($img.Height * $facteur)

    $petite = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($petite)
    $g.InterpolationMode  = 'HighQualityBicubic'
    $g.PixelOffsetMode    = 'HighQuality'
    $g.SmoothingMode      = 'HighQuality'
    $g.CompositingQuality = 'HighQuality'
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $w, $h)))
    $g.Dispose()

    # --- 2. Enregistrer en JPEG de haute qualite
    #
    # On avait d'abord garde le PNG pour les dessins au trait, de peur que le
    # JPEG ne bave autour des traits noirs. Mesure faite le 02/09/2026 sur les
    # trois visages, agrandis quatre fois : aucune difference visible, y compris
    # sur le trait noir franc de Lou. Le poids, lui, est divise par quatre.
    #
    # Le fond transparent devient blanc, ce qui ne change rien : la toile, la
    # fiche et l'image a partager posent toutes du blanc dessous.
    $nom = if ($Id) { $Id } else { ($src.BaseName -replace '[^A-Za-z0-9]', '').ToLower() }
    $enPng = [bool]$Png
    $sortie = Join-Path $visages ($nom + $(if ($enPng) { '.png' } else { '.jpg' }))

    if ($enPng) {
      $petite.Save($sortie, [System.Drawing.Imaging.ImageFormat]::Png)
    } else {
      $plat = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
      $g2 = [System.Drawing.Graphics]::FromImage($plat)
      $g2.Clear([System.Drawing.Color]::White)
      $g2.DrawImage($petite, 0, 0)
      $g2.Dispose()
      $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
               Where-Object { $_.MimeType -eq 'image/jpeg' }
      $reglages = New-Object System.Drawing.Imaging.EncoderParameters(1)
      $reglages.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
                             [System.Drawing.Imaging.Encoder]::Quality, [long]$QUALITE)
      $plat.Save($sortie, $codec, $reglages)
      $plat.Dispose()
    }

    # --- 3. Mesurer le dessin, pour en deduire le cadre
    # On cherche le rectangle des pixels qui ne sont pas transparents. Sur une
    # image sans transparence, ce sera l'image entiere : il faudra alors regler
    # le cadre a l'oeil.
    $r = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $d = $petite.LockBits($r, [System.Drawing.Imaging.ImageLockMode]::ReadOnly,
                          [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $buf = New-Object byte[] ($d.Stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($d.Scan0, $buf, 0, $buf.Length)
    $stride = $d.Stride
    $petite.UnlockBits($d)
    $petite.Dispose()

    $x1 = $w; $x2 = -1; $y1 = $h; $y2 = -1
    for ($y = 0; $y -lt $h; $y++) {
      $ligne = $y * $stride
      for ($x = 0; $x -lt $w; $x++) {
        if ($buf[$ligne + $x * 4 + 3] -gt 8) {
          if ($x -lt $x1) { $x1 = $x }
          if ($x -gt $x2) { $x2 = $x }
          if ($y -lt $y1) { $y1 = $y }
          if ($y -gt $y2) { $y2 = $y }
        }
      }
    }
    $transparent = ($x2 -ge 0) -and ($x2 - $x1 + 1 -lt $w)
    if ($x2 -lt 0) { $x1 = 0; $x2 = $w - 1; $y1 = 0; $y2 = $h - 1 }

    # Une marge d'un vingtieme de la largeur du dessin. Le cadre a le droit de
    # sortir du fichier : ce qui depasse se remplit de blanc.
    $marge = [int][math]::Round(($x2 - $x1 + 1) / 20)
    $cx = $x1 - $marge
    $cy = $y1 - $marge
    $cw = ($x2 - $x1 + 1) + 2 * $marge
    $ch = ($y2 - $y1 + 1) + 2 * $marge

    # --- 4. Le compte rendu
    $ko = (Get-Item $sortie).Length / 1KB
    Write-Host ("  ->  images\visages\" + (Split-Path $sortie -Leaf))
    Write-Host ("      {0} x {1} px, {2:N0} Ko   (original : {3} x {4}, {5:N0} Ko)" -f `
                $w, $h, $ko, $img.Width, $img.Height, ($src.Length / 1KB))
    Write-Host ""
    Write-Host "      A reporter dans app\donnees.js :" -ForegroundColor Yellow
    Write-Host ("        image:  'images/visages/{0}'," -f (Split-Path $sortie -Leaf))
    Write-Host ("        taille: {{ w: {0}, h: {1} }}," -f $w, $h)
    if ($transparent) {
      Write-Host ("        cadre:  {{ x: {0}, y: {1}, w: {2}, h: {3} }}," -f $cx, $cy, $cw, $ch)
      Write-Host ""
      Write-Host ("      Le dessin occupe x {0}->{1} et y {2}->{3} : le cadre ci-dessus" -f $x1, $x2, $y1, $y2)
      Write-Host  "      lui laisse une marge egale tout autour."
    } else {
      Write-Host  "        cadre:  a regler a l'oeil (l'image n'a pas de fond transparent)"
    }
    if ($facteur -lt 1) {
      Write-Host ""
      Write-Host ("      Si tu remplaces l'image d'un visage existant, multiplie ses")
      Write-Host ("      anciens reperes 'visage' par {0:N6}." -f $facteur)
    }
  }
  finally { $img.Dispose() }
}

Write-Host ""
Write-Host "  Termine. Tes originaux restent dans images\visages\originaux\," -ForegroundColor Green
Write-Host "  qui n'est pas publie en ligne."
Write-Host ""
