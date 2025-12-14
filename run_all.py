"""Run everything: backend (FastAPI) + frontend (Vite) + synthetic demo.

Usage:
  python run_all.py        # starts backend + frontend (if npm found) and triggers synthetic demo
  python run_all.py --no-frontend

This script assumes you have the backend Python deps installed (FastAPI/uvicorn).
It inserts `backend/` on `sys.path` so the internal package imports resolve.
On Windows it starts the frontend via `cmd.exe /c npm run dev` so it avoids PowerShell execution-policy issues.
"""

from pathlib import Path
import sys
import time
import subprocess
import shutil
import argparse
import multiprocessing as mp


def run_backend():
    # Ensure backend package is importable
    backend_dir = Path(__file__).resolve().parent / "backend"
    sys.path.insert(0, str(backend_dir))

    try:
        # Import the FastAPI app from the existing server module
        import importlib
        server_mod = importlib.import_module('api.server')
        app = getattr(server_mod, 'app')
    except Exception as e:
        print("Failed to import backend app:", e)
        raise

    try:
        import uvicorn
    except Exception as e:
        print("uvicorn is required to run the backend. Install requirements and retry.")
        raise

    # Run uvicorn in this process (this function runs in a separate process)
    uvicorn.run(app, host='127.0.0.1', port=8000, log_level='info')


def start_frontend(frontend_dir: Path) -> subprocess.Popen:
    npm = shutil.which('npm')
    if not npm:
        print('npm not found in PATH; skipping frontend start')
        return None

    # Use cmd.exe /c to avoid PowerShell execution policy issues on Windows
    cmd = ['cmd.exe', '/c', 'npm', 'run', 'dev']
    proc = subprocess.Popen(cmd, cwd=str(frontend_dir), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    return proc


def trigger_synthetic_demo(wait_seconds: int = 5): # Increased pause to 5s
    import requests
    import time

    # Give the backend service an initial moment to stabilize
    time.sleep(wait_seconds) 
    
    url = 'http://127.0.0.1:8000/api/engine/start'
    params = {'data_source': 'synthetic', 'coins': 'BTC,ETH', 'interval': 1}

    # Increased loop to 20 iterations for a total wait time of ~100 seconds
    for i in range(20): 
        try:
            # Increased request timeout to 15 seconds
            resp = requests.post(url, params=params, timeout=15) 
            print('Engine start response:', resp.status_code, resp.text)
            return
        except requests.exceptions.ReadTimeout:
            print(f'Waiting for backend to be ready... (Attempt {i+1}/20) - Request timed out but server is likely running.')
            time.sleep(wait_seconds)
        except Exception as e:
            print(f'Waiting for backend to be ready... (Attempt {i+1}/20) - Connection error: {e}')
            time.sleep(wait_seconds)

    print('Failed to start synthetic demo: backend did not respond in time after 20 attempts.')
def register_sample_strategy():
    import requests

    url = 'http://127.0.0.1:8000/api/strategies/register'
    params = {'strategy_name': 'SMA_Crossover', 'coin': 'BTC'}
    # The server expects params for name/coin; additional params can be passed in json body if supported
    try:
        resp = requests.post(url, params=params, timeout=5)
        print('Register strategy response:', resp.status_code, resp.text)
    except Exception as e:
        print('Failed to register sample strategy:', e)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--no-frontend', action='store_true', help='Do not start frontend dev server')
    args = parser.parse_args()

    root = Path(__file__).resolve().parent

    # Start backend in a separate process to avoid blocking this script and to preserve imports
    backend_proc = mp.Process(target=run_backend, name='backend')
    backend_proc.start()
    print('Started backend process (pid=%s), waiting for it to become ready...' % backend_proc.pid)

    # Optionally start frontend
    frontend_proc = None
    if not args.no_frontend:
        frontend_dir = root / 'frontend'
        if frontend_dir.exists():
            frontend_proc = start_frontend(frontend_dir)
            if frontend_proc:
                print('Frontend dev server started, check its output for the dev URL')
        else:
            print('Frontend folder not found; skipping frontend')

    # Trigger synthetic demo by calling backend REST endpoint
    trigger_synthetic_demo()

    # Register a simple SMA strategy for BTC (best-effort)
    register_sample_strategy()

    print('\nRun complete. Backend running at http://127.0.0.1:8000')
    print('Press Ctrl-C to stop. This script will keep running and forward frontend logs to stdout if available.')

    try:
        # If frontend was started and we have a pipe, stream its output
        if frontend_proc and frontend_proc.stdout:
            for line in frontend_proc.stdout:
                print('[frontend]', line, end='')
        else:
            # Keep the script alive while backend process is running
            while backend_proc.is_alive():
                time.sleep(1)
    except KeyboardInterrupt:
        print('Stopping services...')
    finally:
        if frontend_proc and frontend_proc.poll() is None:
            frontend_proc.terminate()
        if backend_proc.is_alive():
            backend_proc.terminate()


if __name__ == '__main__':
    main()
