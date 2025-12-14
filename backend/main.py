"""
VELOCITAS HFT ENGINE - Main Application
Entry point for the entire backend system.

Runs:
1. FastAPI server with all endpoints
2. WebSocket connections for real-time updates
3. Live trading, optimization, trend analysis, and copilot modes

Usage:
    python main.py

Access:
    API: http://localhost:8000
    Docs: http://localhost:8000/docs
    WebSocket: ws://localhost:8000/ws/metrics
"""

import logging
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [%(levelname)s] - %(name)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from api.server import app
from api.routes import router

# Include advanced routes
app.include_router(router)


def main():
    """Run the application."""
    import uvicorn
    
    logger.info("=" * 60)
    logger.info("VELOCITAS HFT ENGINE")
    logger.info("=" * 60)
    logger.info("")
    logger.info("Starting server on http://0.0.0.0:8000")
    logger.info("")
    logger.info("Available endpoints:")
    logger.info("  - Live Trading: POST /api/engine/start")
    logger.info("  - Optimization: POST /api/optimization/backtest")
    logger.info("  - Trend Analysis: POST /api/trend-analysis/analyze")
    logger.info("  - Copilot Mode: GET /api/copilot/status")
    logger.info("  - API Docs: http://localhost:8000/docs")
    logger.info("")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )


if __name__ == "__main__":
    main()
