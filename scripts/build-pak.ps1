param(
    [string]$SourceFolder = "localization/pt_BR",
    [string]$DestinationFile = "dist/default.pak",
    [string]$PackageRootName = "default"
)

$sourcePath = Resolve-Path -Path $SourceFolder -ErrorAction Stop
$destinationDir = Split-Path -Path $DestinationFile -Parent
if (-not (Test-Path -Path $destinationDir)) {
    New-Item -ItemType Directory -Path $destinationDir | Out-Null
}

$destinationPak = Join-Path $PWD $DestinationFile
if (Test-Path -Path $destinationPak) {
    Remove-Item -Path $destinationPak -Force
}

$packRoot = Join-Path $PWD "dist/packroot"
if (Test-Path -Path $packRoot) {
    Remove-Item -Recurse -Force -Path $packRoot
}

$packageFolder = Join-Path $packRoot $PackageRootName
New-Item -ItemType Directory -Path $packageFolder -Force | Out-Null
Copy-Item -Path (Join-Path $sourcePath.Path "*") -Destination $packageFolder -Recurse -Force

$zipFile = Join-Path $PWD "dist/default.zip"
if (Test-Path -Path $zipFile) {
    Remove-Item -Path $zipFile -Force
}

Compress-Archive -Path $packageFolder -DestinationPath $zipFile -Force
Rename-Item -Path $zipFile -NewName "default.pak" -Force

Remove-Item -Recurse -Force -Path $packRoot
Write-Host "Built $DestinationFile from $SourceFolder"
