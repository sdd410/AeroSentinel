import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.routes import router, simulation_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background simulation ticker
    sim_task = asyncio.create_task(simulation_loop())
    yield
    # Shutdown: cancel task cleanly
    sim_task.cancel()
    try:
        await sim_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="AeroSentinel API",
    description="Autonomous Drone Swarm Surveillance Simulator Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root():
    return {"message": "AeroSentinel Swarm Simulator Backend Running"}
