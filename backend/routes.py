from fastapi import APIRouter, HTTPException, Depends, Header, status
from typing import Optional
try:
    from . import db, schemas
    from .schemas import AuthRequest, SignupRequest, AuthResponse, CreateRoomRequest, JoinRoomRequest, SaveGameResultRequest
except Exception:
    import db, schemas
    from schemas import AuthRequest, SignupRequest, AuthResponse, CreateRoomRequest, JoinRoomRequest, SaveGameResultRequest

router = APIRouter()


def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1]
    else:
        token = authorization
    user = db.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


@router.post("/auth/signup", response_model=AuthResponse, status_code=201)
def signup(payload: SignupRequest):
    # Check email unique
    for u in db.USERS.values():
        if u.email == payload.email:
            raise HTTPException(status_code=400, detail="Email already exists")
    user = db.create_user(payload.username, payload.email)
    token = db.issue_token_for_user(user.id)
    return AuthResponse(user=user, token=token)


@router.post("/auth/login", response_model=AuthResponse)
def login(payload: AuthRequest):
    user = db.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = db.issue_token_for_user(user.id)
    return AuthResponse(user=user, token=token)


@router.post("/auth/logout", status_code=204)
def logout(current_user: schemas.User = Depends(get_current_user), authorization: Optional[str] = Header(None)):
    token = authorization.split(" ", 1)[1]
    if token in db.TOKENS:
        del db.TOKENS[token]
    return None


@router.get("/auth/me", response_model=schemas.User)
def me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


@router.get("/modes")
def get_modes():
    return [
        {"id": "pass-through", "name": "Pass-Through", "description": "Snakes wrap around"},
        {"id": "walls", "name": "Walls", "description": "Hitting walls kills you"},
    ]


@router.post("/games/results", response_model=schemas.GameResult, status_code=201)
def save_result(payload: SaveGameResultRequest, current_user: schemas.User = Depends(get_current_user)):
    data = payload.model_dump()
    result = db.save_game_result(data)
    return result


@router.get("/leaderboard", response_model=list[schemas.LeaderboardEntry])
def leaderboard():
    # Simple mock leaderboard
    entries = [
        {"rank": 1, "username": "DemoPlayer", "wins": 10, "totalGames": 15, "highestScore": 42, "winRate": 0.66},
        {"rank": 2, "username": "Player2", "wins": 5, "totalGames": 12, "highestScore": 32, "winRate": 0.42},
    ]
    return entries


@router.get("/live-games", response_model=list[schemas.LiveGame])
def live_games():
    return list(db.LIVE_GAMES.values())


@router.post("/rooms", response_model=schemas.GameRoom, status_code=201)
def create_room(payload: CreateRoomRequest):
    room = db.create_room(payload.hostUsername, payload.mode)
    return room


@router.get("/rooms/{roomId}", response_model=schemas.GameRoom)
def get_room(roomId: str):
    room = db.get_room(roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return room


@router.post("/rooms/{roomId}", status_code=204)
def start_room(roomId: str):
    room = db.get_room(roomId)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    room.status = "in-progress"
    return None


@router.post("/rooms/{roomId}/join", response_model=schemas.GameRoom)
def join_room(roomId: str, payload: JoinRoomRequest):
    room, err = db.join_room(roomId, payload.username)
    if err == "not_found":
        raise HTTPException(status_code=404, detail="Room not found")
    if err == "full":
        raise HTTPException(status_code=400, detail="Room full")
    if err == "already":
        raise HTTPException(status_code=400, detail="Already in room")
    return room


@router.post("/rooms/{roomId}/leave", status_code=204)
def leave_room(roomId: str, payload: JoinRoomRequest):
    ok = db.leave_room(roomId, payload.username)
    if not ok:
        raise HTTPException(status_code=404, detail="Room not found")
    return None
