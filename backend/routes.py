from fastapi import APIRouter, HTTPException, Depends, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List
from . import db, schemas, database, models

router = APIRouter()

# Dependency
async def get_db_session():
    async with database.SessionLocal() as session:
        yield session

async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: AsyncSession = Depends(get_db_session)
):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    else:
        token = authorization
    user = await db.get_user_by_token(session, token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


@router.post("/auth/signup", response_model=schemas.AuthResponse, status_code=201)
async def signup(payload: schemas.SignupRequest, session: AsyncSession = Depends(get_db_session)):
    # Check email unique - simplified for now, usually DB constraint handles this
    # But we can do a check if we want specific error message
    # For now, let's just try to create and catch error or let create_user handle it?
    # The current create_user doesn't check, so let's check manually
    from sqlalchemy import select
    res = await session.execute(select(models.User).where(models.User.email == payload.email))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = await db.create_user(session, payload.username, payload.email)
    token = db.issue_token_for_user(user.id)
    return schemas.AuthResponse(user=user, token=token)


@router.post("/auth/login", response_model=schemas.AuthResponse)
async def login(payload: schemas.AuthRequest, session: AsyncSession = Depends(get_db_session)):
    user = await db.authenticate_user(session, payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = db.issue_token_for_user(user.id)
    return schemas.AuthResponse(user=user, token=token)


@router.post("/auth/logout", status_code=204)
async def logout(
    current_user: models.User = Depends(get_current_user), 
    authorization: Optional[str] = Header(None)
):
    token = authorization.split(" ", 1)[1]
    if token in db.TOKENS:
        del db.TOKENS[token]
    return None


@router.get("/auth/me", response_model=schemas.User)
async def me(current_user: models.User = Depends(get_current_user)):
    return current_user


@router.get("/modes")
async def get_modes():
    return [
        {"id": "pass-through", "name": "Pass-Through", "description": "Snakes wrap around"},
        {"id": "walls", "name": "Walls", "description": "Hitting walls kills you"},
    ]


@router.post("/games/results", response_model=schemas.GameResult, status_code=201)
async def save_result(
    payload: schemas.SaveGameResultRequest, 
    current_user: models.User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session)
):
    data = payload.model_dump()
    result = await db.save_game_result(session, data)
    return result


@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
async def leaderboard(session: AsyncSession = Depends(get_db_session)):
    return await db.get_leaderboard(session)


@router.get("/live-games", response_model=List[schemas.LiveGame])
async def live_games(session: AsyncSession = Depends(get_db_session)):
    return await db.get_live_games(session)


@router.post("/rooms", response_model=schemas.GameRoom, status_code=201)
async def create_room(
    payload: schemas.CreateRoomRequest,
    session: AsyncSession = Depends(get_db_session)
):
    room = await db.create_room(session, payload.hostUsername, payload.mode)
    return room


@router.get("/rooms/{roomId}", response_model=schemas.GameRoom)
async def get_room(roomId: str, session: AsyncSession = Depends(get_db_session)):
    room = await db.get_room(session, roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.post("/rooms/{roomId}", status_code=204)
async def start_room(roomId: str, session: AsyncSession = Depends(get_db_session)):
    room = await db.get_room(session, roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    await db.start_room(session, roomId)
    return None


@router.post("/rooms/{roomId}/join", response_model=schemas.GameRoom)
async def join_room(
    roomId: str, 
    payload: schemas.JoinRoomRequest,
    session: AsyncSession = Depends(get_db_session)
):
    room, err = await db.join_room(session, roomId, payload.username)
    if err == "not_found":
        raise HTTPException(status_code=404, detail="Room not found")
    if err == "full":
        raise HTTPException(status_code=400, detail="Room full")
    if err == "already":
        raise HTTPException(status_code=400, detail="Already in room")
    return room


@router.post("/rooms/{roomId}/leave", status_code=204)
async def leave_room(
    roomId: str, 
    payload: schemas.JoinRoomRequest,
    session: AsyncSession = Depends(get_db_session)
):
    ok = await db.leave_room(session, roomId, payload.username)
    if not ok:
        raise HTTPException(status_code=404, detail="Room not found")
    return None
