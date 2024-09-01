@echo off
REM Enable local variables
setlocal

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

REM Set the default EXEC_PATH variable to the custom node binary
set "EXEC_PATH="
if exist "%KIT%/node_modules/.bin/pnpm" (
    for /f "tokens=* USEBACKQ" %%F in (`%KIT%/node_modules/.bin/pnpm node -p "process.execPath" 2^>nul`) do (
        set "EXEC_PATH=%%F"
    )
)
if not defined EXEC_PATH (
    for /f "tokens=* USEBACKQ" %%F in (`pnpm node -p "process.execPath" 2^>nul`) do (
        set "EXEC_PATH=%%F"
    )
)
if not defined EXEC_PATH (
    for /f "tokens=* USEBACKQ" %%F in (`node -p "process.execPath" 2^>nul`) do (
        set "EXEC_PATH=%%F"
    )
)

if not defined EXEC_PATH (
    echo Node not found, please provide an EXEC_PATH in your environment
    exit /b 1
)

REM Set the NODE_NO_WARNINGS environment variable
set "NODE_NO_WARNINGS=1"

REM Run the terminal.js file with the determined Node.js binary and pass all arguments
"%EXEC_PATH%" --loader "file://%KIT%/build/loader.js" "%KIT%/run/terminal.js" %*