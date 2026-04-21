# criar_pak.ps1
# Empacota localization/default/ em dist/default.pak (formato ZIP renomeado)
# Uso: .\criar_pak.ps1

param(
    [string]$Source   = "$PSScriptRoot\localization\default",
    [string]$Output   = "$PSScriptRoot\dist\default.pak"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

if (-not (Test-Path $Source)) {
    Write-Error "Pasta fonte nao encontrada: $Source"
    exit 1
}

$distDir = Split-Path $Output
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

if (Test-Path $Output) {
    Remove-Item $Output -Force
}

# Criar ZIP com separadores "/" (forward slash) para compatibilidade com o formato original do jogo
$zipStream = [System.IO.File]::Open($Output, [System.IO.FileMode]::Create)
$archive   = New-Object System.IO.Compression.ZipArchive($zipStream, [System.IO.Compression.ZipArchiveMode]::Create)

# Incluir explicitamente a pasta raiz "default/" para espelhar o pacote original do jogo.
$archive.CreateEntry("default/") | Out-Null

Get-ChildItem $Source -Recurse | ForEach-Object {
    $rel = $_.FullName.Substring($Source.Length).TrimStart('\').Replace('\', '/')
    $entryName = "default/$rel"

    if ($_.PSIsContainer) {
        $archive.CreateEntry("$entryName/") | Out-Null
    } else {
        $entry      = $archive.CreateEntry($entryName, [System.IO.Compression.CompressionLevel]::Optimal)
        $entryStream = $entry.Open()
        $fileStream  = [System.IO.File]::OpenRead($_.FullName)
        $fileStream.CopyTo($entryStream)
        $fileStream.Dispose()
        $entryStream.Dispose()
    }
}

$archive.Dispose()
$zipStream.Dispose()

$size = [math]::Round((Get-Item $Output).Length / 1KB, 1)
Write-Host "OK: $Output criado ($size KB)"
Write-Host ""
Write-Host "Para instalar:"
Write-Host "  1. Faca backup do original:"
Write-Host "     Copy-Item 'C:\Program Files (x86)\Steam\steamapps\common\Call to Arms - Gates of Hell\localizations\default.pak' -Destination 'default-original.pak'"
Write-Host "  2. Copie o pak gerado:"
Write-Host "     Copy-Item '$Output' 'C:\Program Files (x86)\Steam\steamapps\common\Call to Arms - Gates of Hell\localizations\default.pak'"
