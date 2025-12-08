import pytest
import os
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from backend.database import Base, get_db
from backend.app import app
from backend import models

# Use a separate test database
# Use a separate test database
TEST_DATABASE_URL = f"sqlite+aiosqlite:///{os.path.abspath('test_integration.db')}"

engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = async_sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="module", autouse=True)
async def setup_database():
    # Ensure models are loaded
    from backend import models
    print(f"DEBUG: Creating tables: {Base.metadata.tables.keys()}")
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Drop tables (optional, or keep for inspection)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    # Remove file
    if os.path.exists("./test_integration.db"):
        os.remove("./test_integration.db")

@pytest.mark.anyio
async def test_full_flow():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Signup
        r = await ac.post("/auth/signup", json={"email": "int@test.com", "password": "pass", "username": "IntUser"})
        assert r.status_code == 201
        data = r.json()
        token = data["token"]
        assert data["user"]["username"] == "IntUser"

        # 2. Login
        r = await ac.post("/auth/login", json={"email": "int@test.com", "password": "pass"})
        assert r.status_code == 200
        token = r.json()["token"]

        # 3. Create Room
        r = await ac.post("/rooms", json={"hostUsername": "IntUser", "mode": "walls"})
        assert r.status_code == 201
        room_id = r.json()["id"]

        # 4. Join Room (as another user)
        # Create user 2
        await ac.post("/auth/signup", json={"email": "p2@test.com", "password": "pass", "username": "P2"})
        
        r = await ac.post(f"/rooms/{room_id}/join", json={"username": "P2"})
        assert r.status_code == 200
        room = r.json()
        assert "P2" in room["players"]

        # 5. Start Room
        r = await ac.post(f"/rooms/{room_id}")
        assert r.status_code == 204
        
        # Verify status
        r = await ac.get(f"/rooms/{room_id}")
        assert r.json()["status"] == "in-progress"
