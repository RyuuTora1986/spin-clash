param(
  [Parameter(Mandatory = $true)]
  [string]$OutPath
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms

$signature = @"
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class NativeWindowTools {
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT {
    public int Left;
    public int Top;
    public int Right;
    public int Bottom;
  }

  [DllImport("user32.dll")]
  public static extern IntPtr GetForegroundWindow();

  [DllImport("user32.dll", SetLastError=true)]
  public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);

  [DllImport("user32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
  public static extern int GetWindowTextW(IntPtr hWnd, StringBuilder text, int count);
}
"@

Add-Type -TypeDefinition $signature | Out-Null

$handle = [NativeWindowTools]::GetForegroundWindow()
if ($handle -eq [IntPtr]::Zero) {
  throw 'No foreground window detected.'
}

$rect = New-Object NativeWindowTools+RECT
if (-not [NativeWindowTools]::GetWindowRect($handle, [ref]$rect)) {
  throw 'Failed to read foreground window bounds.'
}

$titleBuilder = New-Object System.Text.StringBuilder 1024
[void][NativeWindowTools]::GetWindowTextW($handle, $titleBuilder, $titleBuilder.Capacity)
$title = $titleBuilder.ToString()

$width = [Math]::Max(1, $rect.Right - $rect.Left)
$height = [Math]::Max(1, $rect.Bottom - $rect.Top)

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.CopyFromScreen($rect.Left, $rect.Top, 0, 0, $bitmap.Size)

$targetDir = Split-Path -Parent $OutPath
if ($targetDir) {
  New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

$bitmap.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$graphics.Dispose()
$bitmap.Dispose()

[pscustomobject]@{
  title = $title
  left = $rect.Left
  top = $rect.Top
  width = $width
  height = $height
  out = (Resolve-Path $OutPath).Path
} | ConvertTo-Json -Depth 3
