@echo off
REM Enable local variables
setlocal

REM Get the parent directory of the script file
set "KIT=%~dp0.."

REM Check if the script file is in the "node_modules" directory
echo %~dp0 | findstr /C:"node_modules" >nul
if %errorlevel%==0 (
    REM Set KENV variable to the grandparent directory of the script file
    cd /d "%~dp0../.."
    set "KENV=%CD%"
)

REM Set the default KIT_NODE variable to the custom node binary
if not defined KIT_NODE (
    set "KIT_NODE=%KIT%/../.knode/bin/node"
)

REM Check if the custom node binary exists, if not, use the system's node binary
if not exist "%KIT_NODE%" (
    for /f "tokens=* USEBACKQ" %%F in (`where node`) do (
        set "KIT_NODE=%%F"
    )
)

REM Set the NODE_NO_WARNINGS environment variable
set "NODE_NO_WARNINGS=1"

REM Run the terminal.js file with the determined Node.js binary and pass all arguments
"%KIT_NODE%" --loader "file://%KIT%/build/loader.js" "%KIT%/run/terminal.js" %*