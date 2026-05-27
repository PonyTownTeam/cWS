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
set NODE_MAJOR=24

set TARGET_DIR=targets\node-%NODE_VERSION%
set INTERNAL_HEADERS_DIR=src\headers\%NODE_MAJOR%

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

if not exist src\headers (
    mkdir src\headers
)

REM =========================================================
REM Download Official Node Headers + node.lib
REM =========================================================

if not exist "%TARGET_DIR%" (

    echo.
    echo Downloading official Node.js headers...
    echo.

    powershell -Command ^
        "Invoke-WebRequest -Uri https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%-headers.tar.gz -OutFile targets\node-%NODE_VERSION%-headers.tar.gz"

    echo Extracting official headers...

    tar -xzf targets\node-%NODE_VERSION%-headers.tar.gz -C targets

    echo Downloading node.lib...

    powershell -Command ^
        "Invoke-WebRequest -Uri https://nodejs.org/dist/%NODE_VERSION%/win-x64/node.lib -OutFile %TARGET_DIR%\node.lib"
)

REM =========================================================
REM Download Internal Node Source Headers
REM =========================================================

if not exist "%INTERNAL_HEADERS_DIR%\tcp_wrap.h" (

    echo.
    echo Downloading internal Node.js source headers...
    echo.

    powershell -Command ^
        "Invoke-WebRequest -Uri https://nodejs.org/dist/%NODE_VERSION%/node-%NODE_VERSION%.tar.xz -OutFile targets\node-%NODE_VERSION%.tar.xz"

    echo Extracting internal headers...

    tar -xf targets\node-%NODE_VERSION%.tar.xz -C targets

    if not exist "%INTERNAL_HEADERS_DIR%" (
        mkdir "%INTERNAL_HEADERS_DIR%"
    )

    echo Copying src headers...

    copy /Y "%TARGET_DIR%\src\*.h" "%INTERNAL_HEADERS_DIR%\" >nul

    echo Copying V8 headers...

    copy /Y "%TARGET_DIR%\deps\v8\include\*.h" "%INTERNAL_HEADERS_DIR%\" >nul

    if exist "%TARGET_DIR%\deps\ncrypto" (
        if not exist "%INTERNAL_HEADERS_DIR%\crypto" (
            mkdir "%INTERNAL_HEADERS_DIR%\crypto"
        )

        copy /Y "%TARGET_DIR%\deps\ncrypto\*.h" "%INTERNAL_HEADERS_DIR%\crypto\" >nul
    )

    for %%D in (crypto permission tracing quic) do (
        if exist "%TARGET_DIR%\src\%%D" (
            xcopy "%TARGET_DIR%\src\%%D" "%INTERNAL_HEADERS_DIR%\%%D\" /E /I /Y >nul
        )
    )
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

if not exist "%INTERNAL_HEADERS_DIR%\tcp_wrap.h" (
    echo.
    echo ERROR: Internal Node header missing:
    echo %INTERNAL_HEADERS_DIR%\tcp_wrap.h
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
 /DHAVE_SQLITE=0 ^
 /DHAVE_AMARO=0 ^
 /I src ^
 /I %INTERNAL_HEADERS_DIR% ^
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