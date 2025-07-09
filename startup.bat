@echo off
REM Windows startup script for local development
REM Mirrors logic from startup.sh (no supervisord/production logic)

REM Set PYTHONPATH for Windows (use ; as separator)
set PYTHONPATH=%PYTHONPATH%;%cd%\src;%cd%\backend\src

REM Start backend services in background
start "" python backend\src\plugins\mcp\sow_mcp_agent.py --transport sse --port 9999
start "" python backend\src\plugins\mcp\resource_mcp.py
start "" python backend\src\a2a_server.py

REM Wait for backend services to be ready
call :wait_for_port 9999 "sow_mcp_agent"
call :wait_for_port 9001 "resource_mcp"
call :wait_for_port 9002 "a2a_server"

REM Start API server in background
start "" python backend\src\api.py

REM Change to frontend directory and run dev server (foreground)
cd frontend
npm run dev
exit /b

:wait_for_port
REM %1 = port, %2 = name
echo Waiting for %2 to be ready on port %1...
:wait_loop
powershell -Command "try { (New-Object Net.Sockets.TcpClient('localhost', %1)).Close(); exit 0 } catch { exit 1 }"
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait_loop
)
echo %2 is ready on port %1.
exit /b
