@echo off
setlocal enabledelayedexpansion

REM =========================================================
REM Configure Visual Studio Build Environment
REM =========================================================

call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat"

REM =========================================================
REM Node.js Version
REM =========================================================

set NODE_VERSION=v24.16.0
set TARGET_DIR=targets\node-%NODE_VERSION%

REM =========================================================
REM Create Directories
REM =========================================================

if not exist targets (
    mkdir targets
)

if not exist dist (
    mkdir dist
)

if not exist dist\bindings (
    mkdir dist\bindings
)

REM =========================================================
REM Download Node Headers + node.lib
REM =========================================================

if not exist "%TARGET_DIR%" (

    echo Downloading Node.js headers...

    powershell -Command ^
        "Invoke-WebRequest -Uri https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-headers.tar.gz -OutFile targets\node-%NODE_VERSION%-headers.tar.gz"

    echo Extracting headers...

    tar -xzf targets\node-%NODE_VERSION%-headers.tar.gz -C targets

    echo Downloading node.lib...

    powershell -Command ^
        "Invoke-WebRequest -Uri https://nodejs.org/dist/%NODE_VERSION%/win-x64/node.lib -OutFile %TARGET_DIR%\node.lib"
)

REM =========================================================
REM Verify Header Paths
REM =========================================================

if not exist "%TARGET_DIR%\include\node\node.h" (
    echo.
    echo ERROR: Node headers not found.
    echo Expected:
    echo %TARGET_DIR%\include\node\node.h
    echo.
    pause
    exit /b 1
)

if not exist "src\headers\24\tcp_wrap.h" (
    echo.
    echo ERROR: Missing custom header:
    echo src\headers\24\tcp_wrap.h
    echo.
    pause
    exit /b 1
)

REM =========================================================
REM Build Native Module
REM =========================================================

echo.
echo Building native module...
echo.

cl ^
 /std:c++20 ^
 /Zc:__cplusplus ^
 /EHsc ^
 /Ox ^
 /LD ^
 /I src ^
 /I %TARGET_DIR%\include\node ^
 /I %TARGET_DIR%\deps\uv\include ^
 /I %TARGET_DIR%\deps\v8\include ^
 /I %TARGET_DIR%\deps\openssl\openssl\include ^
 /I %TARGET_DIR%\deps\zlib ^
 /Fedist\bindings\cws_win32_137.node ^
 src\*.cpp ^
 %TARGET_DIR%\node.lib

if errorlevel 1 (
    echo.
    echo Build failed.
    echo.
    pause
    exit /b 1
)

REM =========================================================
REM Cleanup
REM =========================================================

del /Q *.obj 2>nul
del /Q dist\bindings\*.exp 2>nul
del /Q dist\bindings\*.lib 2>nul

echo.
echo Build complete.
echo Output:
echo dist\bindings\cws_win32_137.node
echo.

pause