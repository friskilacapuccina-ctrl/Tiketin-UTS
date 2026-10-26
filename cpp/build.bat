@echo off
setlocal
cd /d "%~dp0"

rem =============================================================
rem Tiketin-UTS — kompilasi & pengujian modul C++ (MSVC)
rem Kompilasi terpisah dari website; hasil: tiketin_test.exe
rem =============================================================

set "VSWHERE=%ProgramFiles(x86)%\Microsoft Visual Studio\Installer\vswhere.exe"
if not exist "%VSWHERE%" (
  echo [ERROR] vswhere tidak ditemukan. Pasang Visual Studio dengan workload C++.
  exit /b 1
)

set "VSINSTALL="
for /f "usebackq delims=" %%i in (`"%VSWHERE%" -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath`) do set "VSINSTALL=%%i"
if not defined VSINSTALL (
  echo [ERROR] Toolset MSVC tidak ditemukan di mesin ini.
  exit /b 1
)

call "%VSINSTALL%\VC\Auxiliary\Build\vcvars64.bat" >nul
if errorlevel 1 (
  echo [ERROR] Gagal memuat environment MSVC ^(vcvars64.bat^).
  exit /b 1
)

echo == Kompilasi ==
cl /nologo /EHsc /std:c++17 /W4 /Fe:tiketin_test.exe main.cpp ticket.cpp
if errorlevel 1 (
  echo [ERROR] Kompilasi gagal.
  exit /b 1
)

rem Hapus file objek segera setelah kompilasi (jangan menunggu tes selesai)
del /q *.obj >nul 2>&1

echo.
echo == Pengujian ==
tiketin_test.exe
set "RESULT=%ERRORLEVEL%"
exit /b %RESULT%
