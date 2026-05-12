@echo off
setlocal enabledelayedexpansion

REM =========================================================
REM Configure Visual Studio Build Environment
REM =========================================================

call "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat"

REM =========================================================
REM Node.js Version
REM =========================================================

set NODE_VERSION=v24.11.1
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

    tar -xzf targets\node-%NODE_VERSION%-headers.tar.gz -C targets

    echo Downloading node.lib...

    powershell -Command ^
        "Invoke-WebRequest -Uri https://nodejs.org/dist/%NODE_VERSION%/win-x64/node.lib -OutFile %TARGET_DIR%\node.lib"
)

REM =========================================================
REM Build Native Module
REM =========================================================

cl ^
 /std:c++20 ^
 /Zc:__cplusplus ^
 /EHsc ^
 /Ox ^
 /LD ^
 /I src\headers\24 ^
 /I %TARGET_DIR%\include\node ^
 /I %TARGET_DIR%\deps\uv\include ^
 /I %TARGET_DIR%\deps\v8\include ^
 /I %TARGET_DIR%\deps\openssl\openssl\include ^
 /I %TARGET_DIR%\deps\zlib ^
 /Fedist\bindings\cws_win32_137.node ^
 src\*.cpp ^
 %TARGET_DIR%\node.lib

REM =========================================================
REM Cleanup
REM =========================================================

del /Q *.obj 2>nul
del /Q dist\bindings\*.exp 2>nul
del /Q dist\bindings\*.lib 2>nul

echo.
echo Build complete.