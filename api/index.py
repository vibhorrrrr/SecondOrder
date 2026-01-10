"""
Vercel serverless function for the Business Simulator API.
This wraps the FastAPI application for Vercel's Python runtime.
"""
import os
import sys
import logging
from typing import Dict, Any

# Add parent directory to path to allow imports from root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from business_state import BusinessState
from monte_carlo import run_monte_carlo
from node_generation_gemini import generate_child_nodes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Business Simulator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SimulationRequest(BaseModel):
    initial_state: Dict[str, Any]
    action: Dict[str, Any]
    months: int = 12
    num_runs: int = 20


class NodeGenerationRequest(BaseModel):
    state: Dict[str, Any]


@app.get("/api")
async def root():
    return {"message": "Business Simulator API", "status": "healthy"}


@app.post("/api/simulate")
async def simulate(request: SimulationRequest):
    try:
        logger.info(f"Received simulation request: {request.action}")

        try:
            state = BusinessState.from_dict(request.initial_state)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid initial state: {str(e)}")

        try:
            results = run_monte_carlo(
                state,
                request.action,
                months=request.months,
                num_runs=request.num_runs
            )
        except Exception as e:
            logger.error(f"Simulation failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Simulation failed: {str(e)}")

        return results
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate_nodes")
async def generate_nodes(request: NodeGenerationRequest):
    try:
        logger.info("Generating decision nodes...")
        state = BusinessState.from_dict(request.state)
        nodes = generate_child_nodes(state)
        return {"nodes": nodes}
    except Exception as e:
        logger.error(f"Node generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
