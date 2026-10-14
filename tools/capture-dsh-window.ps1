# 开发/审阅辅助：抓取 DSH 桌面端窗口截图。
#
# DSH Web GUI 需要 dsh web 启动时打印的带 token 的 URL 才能访问（401 = 未认证），
# 所以调试主题时最省事的做法是直接对 Electron 窗口截图。
#
#   pwsh -File tools/capture-dsh-window.ps1 -Out docs/app-light.png
#   pwsh -File tools/capture-dsh-window.ps1 -Out docs/app-dark.png -Maximize
#
# 依赖：Windows + .NET(System.Drawing) + 已运行的 DSH 桌面端。
param(
  [string]$Out = 'dsh-window.png',
  [string]$ProcessName = 'DeepSeek Harness',
  [switch]$Maximize
)

Add-Type -AssemblyName System.Drawing

Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;

public static class DshCapture {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc cb, IntPtr param);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetWindowTextW(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern int GetClassNameW(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT rect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdc, uint flags);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int cmd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);

  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }
}
'@

[System.Diagnostics.Process]::GetCurrentProcess().Refresh()
[System.Runtime.InteropServices.Marshal]::GetLastWin32Error() | Out-Null
[DshCapture]::SetProcessDPIAware() | Out-Null

$targetPids = @(Get-Process -Name $ProcessName -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id)
if ($targetPids.Count -eq 0) { throw "找不到进程「$ProcessName」，DSH 桌面端在运行吗？" }

$found = New-Object System.Collections.ArrayList
$cb = [DshCapture+EnumWindowsProc]{
  param($hWnd, $param)
  if (-not [DshCapture]::IsWindowVisible($hWnd)) { return $true }
  $id = 0
  [DshCapture]::GetWindowThreadProcessId($hWnd, [ref]$id) | Out-Null
  if ($targetPids -notcontains [int]$id) { return $true }
  $cls = New-Object System.Text.StringBuilder 256
  [DshCapture]::GetClassNameW($hWnd, $cls, 256) | Out-Null
  if ($cls.ToString() -ne 'Chrome_WidgetWin_1') { return $true }
  $r = New-Object DshCapture+RECT
  [DshCapture]::GetWindowRect($hWnd, [ref]$r) | Out-Null
  if (($r.Right - $r.Left) -lt 400) { return $true }
  $null = $found.Add(@{ Handle = $hWnd; W = $r.Right - $r.Left; H = $r.Bottom - $r.Top })
  return $true
}
[DshCapture]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null

if ($found.Count -eq 0) { throw "找到 $ProcessName 进程，但没有可见的主窗口" }
$win = $found | Sort-Object { -$_.W * $_.H } | Select-Object -First 1
$hwnd = [IntPtr]$win.Handle

if ([DshCapture]::IsIconic($hwnd)) { [DshCapture]::ShowWindow($hwnd, 9) | Out-Null }
if ($Maximize) { [DshCapture]::ShowWindow($hwnd, 3) | Out-Null; Start-Sleep -Milliseconds 800 }

$r = New-Object DshCapture+RECT
[DshCapture]::GetWindowRect($hwnd, [ref]$r) | Out-Null
$w = $r.Right - $r.Left; $h = $r.Bottom - $r.Top

$bmp = New-Object System.Drawing.Bitmap($w, $h)
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $gfx.GetHdc()
# PW_RENDERFULLCONTENT(2)：让 Chromium 渲染完整内容（包含被其它窗口遮挡的区域）
$ok = [DshCapture]::PrintWindow($hwnd, $hdc, 2)
$gfx.ReleaseHdc($hdc)
$gfx.Dispose()

$dir = Split-Path -Parent $Out
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()

Write-Output "saved $Out (${w}x${h}) handle=$($win.Handle) printWindow=$ok"
