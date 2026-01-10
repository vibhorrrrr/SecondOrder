import os
import sys
import logging
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from business_state import BusinessState
from monte_carlo import run_monte_carlo
from node_generation_gemini import generate_child_nodes

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Business Simulator API")

# Configure CORS - Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for local development
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

@app.post("/simulate")
async def simulate(request: SimulationRequest):
    try:
        logger.info(f"Received simulation request: {request.action}")
        
        # Parse state
        try:
            state = BusinessState.from_dict(request.initial_state)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid initial state: {str(e)}")
            
        # Run Simulation
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

@app.post("/generate_nodes")
async def generate_nodes(request: NodeGenerationRequest):
    try:
        logger.info("Generating decision nodes...")
        state = BusinessState.from_dict(request.state)
        nodes = generate_child_nodes(state)
        return {"nodes": nodes}
    except Exception as e:
        logger.error(f"Node generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Check for API Key
    if not os.environ.get("GOOGLE_API_KEY"):
        logger.warning("GOOGLE_API_KEY not set. Gemini features will use mock data or fail.")
        
    uvicorn.run(app, host="0.0.0.0", port=8000)
