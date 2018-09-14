$ErrorActionPreference = "Stop"

$folder = Split-Path -Parent $PSCommandPath
$name = Split-Path $folder -Leaf
Push-Location $folder

$bins = @()
$reg = Get-ItemProperty HKLM:\SOFTWARE\WOW6432Node\SRC\Alteryx -ErrorAction SilentlyContinue
if ($null -ne $reg -and $null -ne $reg.InstallDir64) {
    $bins += $reg.InstallDir64
}
$reg = Get-ItemProperty HKCU:\SOFTWARE\SRC\Alteryx -ErrorAction SilentlyContinue
if ($null -ne $reg -and $null -ne $reg.InstallDir64) {
    $bins += $reg.InstallDir64
}

foreach ($dir in $bins) {
    $bin = Join-Path $dir "HtmlPlugins\$name"
    if (Test-Path $bin) {
        Write-Host "Removing Existing Link $bin"
        $cmd = "/c rmdir ""$bin"""
        Start-Process cmd -ArgumentList $cmd -verb RunAs -wait
    }
}

Pop-Location