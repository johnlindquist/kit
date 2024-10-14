@echo off
REM Enable local variables
setlocal

REM Source environment variables from .env file if it exists
if exist "%USERPROFILE%\.kenv\.env" (
    for /F "usebackq tokens=*" %%A in ("%USERPROFILE%\.kenv\.env") do (
        set %%A
    )
)

REM Get the parent directory of the script file
set "KIT=%~dp0.."
set "KIT_TARGET=terminal"

REM Check if the script file is in the "node_modules" directory
echo %~dp0 | findstr /C:"node_modules" >nul
if %errorlevel%==0 (
    REM Set KENV variable to the grandparent directory of the script file
    cd /d "%~dp0../.."
    set "KENV=%CD%"
)

REM Change to KIT directory before attempting to find Node.js
pushd "%KIT%"

REM Set the default KIT_NODE_PATH variable to the custom node binary
if not defined KIT_NODE_PATH (
    set "KIT_NODE_PATH="
    if exist "%KIT%/node_modules/.bin/pnpm" (
        for /f "tokens=* USEBACKQ" %%F in (`%KIT%/node_modules/.bin/pnpm node -p "process.execPath" 2^>nul`) do (
            set "KIT_NODE_PATH=%%F"
        )
    )
    
    if not defined KIT_NODE_PATH if exist "%KIT%\pnpm" (
        for /f "tokens=* USEBACKQ" %%F in (`"%KIT%\pnpm" node -p "process.execPath" 2^>nul`) do (
            set "KIT_NODE_PATH=%%F"
        )
    )
    
    if not defined KIT_NODE_PATH (
        for /f "tokens=* USEBACKQ" %%F in (`pnpm node -p "process.execPath" 2^>nul`) do (
            set "KIT_NODE_PATH=%%F"
        )
    )
    
    if not defined KIT_NODE_PATH (
        for /f "tokens=* USEBACKQ" %%F in (`node -p "process.execPath" 2^>nul`) do (
            set "KIT_NODE_PATH=%%F"
        )
    )
)

REM Change back to the original directory
popd

if not defined KIT_NODE_PATH (
    echo Node not found, please provide a KIT_NODE_PATH in your environment
    exit /b 1
)

REM Set the NODE_NO_WARNINGS environment variable
set "NODE_NO_WARNINGS=1"

REM Run the terminal.js file with the determined Node.js binary and pass all arguments
"%KIT_NODE_PATH%" --loader "file://%KIT%/build/loader.js" "%KIT%/run/terminal.js" %*
