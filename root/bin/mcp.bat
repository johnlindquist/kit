@echo off
setlocal enabledelayedexpansion

:: Load KENV environment if exists
if exist "%USERPROFILE%\.kenv\.env" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%USERPROFILE%\.kenv\.env") do (
        set "%%a=%%b"
    )
)

:: Get the directory of this script
set "SCRIPT_DIR=%~dp0"
set "KIT=%SCRIPT_DIR%.."

:: Normalize the path
pushd "%KIT%"
set "KIT=%CD%"
popd

:: Only set KIT_NODE_PATH if it's not already set
if not defined KIT_NODE_PATH (
    :: Try to find node from pnpm
    for /f "tokens=*" %%i in ('"%KIT%\node_modules\.bin\pnpm" node -p "process.execPath" 2^>nul') do set "KIT_NODE_PATH=%%i"
    if not defined KIT_NODE_PATH (
        for /f "tokens=*" %%i in ('"%KIT%\pnpm" node -p "process.execPath" 2^>nul') do set "KIT_NODE_PATH=%%i"
    )
    if not defined KIT_NODE_PATH (
        for /f "tokens=*" %%i in ('pnpm node -p "process.execPath" 2^>nul') do set "KIT_NODE_PATH=%%i"
    )
    if not defined KIT_NODE_PATH (
        for /f "tokens=*" %%i in ('node -p "process.execPath" 2^>nul') do set "KIT_NODE_PATH=%%i"
    )
    if not defined KIT_NODE_PATH (
        echo Error: Node.js not found in PATH. Provide a KIT_NODE_PATH in your environment. >&2
        exit /b 1
    )
)

:: Set environment variables and run
set "KIT_TARGET=terminal"
set "NODE_NO_WARNINGS=1"

"%KIT_NODE_PATH%" --loader "file:///%KIT:\=/%/build/loader.js" "%KIT%\run\mcp-server.js" %*

endlocal