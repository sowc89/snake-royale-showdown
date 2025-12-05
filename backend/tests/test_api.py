import asyncio
import pytest
from httpx import AsyncClient

from backend.app import app
from backend import db


@pytest.mark.asyncio
async def test_signup_login_logout_me():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # signup
        r = await ac.post("/auth/signup", json={"email": "demo@game.com", "password": "demo", "username": "DemoPlayer"})
        assert r.status_code == 201
        data = r.json()
        token = data["token"]

        # me
        r = await ac.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["username"] == "DemoPlayer"

        # logout
        r = await ac.post("/auth/logout", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 204

        # me should fail now
        r = await ac.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 401


@pytest.mark.asyncio
async def test_modes_and_leaderboard_and_live_games():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/modes")
        assert r.status_code == 200
        modes = r.json()
        assert any(m["id"] == "pass-through" for m in modes)

        r = await ac.get("/leaderboard")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

        r = await ac.get("/live-games")
        assert r.status_code == 200


@pytest.mark.asyncio
async def test_rooms_and_game_result():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # create room
        r = await ac.post("/rooms", json={"hostUsername": "Host", "mode": "walls"})
        assert r.status_code == 201
        room = r.json()
        roomId = room["id"]

        # join room
        r = await ac.post(f"/rooms/{roomId}/join", json={"username": "Player2"})
        assert r.status_code == 200

        # start room
        r = await ac.post(f"/rooms/{roomId}")
        assert r.status_code == 204

        # create a demo user to save result
        r = await ac.post("/auth/signup", json={"email": "g@p.com", "password": "p", "username": "Gamer"})
        assert r.status_code == 201
        token = r.json()["token"]

        # save game result
        payload = {
            "player1": "Host",
            "player2": "Player2",
            "winner": "Host",
            "player1Score": 5,
            "player2Score": 3,
            "mode": "walls",
            "duration": 60,
        }
        r = await ac.post("/games/results", json=payload, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 201
        res = r.json()
        assert res["player1"] == "Host"
