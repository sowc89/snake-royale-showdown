from typing import Dict, List
import time
import uuid

try:
    from .schemas import User, GameResult, GameRoom, LiveGame
except ImportError:
    from schemas import User, GameResult, GameRoom, LiveGame

# Simple in-memory mock database
# Simple in-memory mock database
USERS: Dict[str, User] = {
    "u1": User(id="u1", username="DemoPlayer", email="demo@game.com"),
    "u2": User(id="u2", username="ProGamer", email="pro@game.com"),
}
TOKENS: Dict[str, str] = {}  # token -> user_id
GAME_RESULTS: Dict[str, GameResult] = {
    "r1": GameResult(
        id="r1", player1="DemoPlayer", player2="ProGamer", winner="ProGamer",
        player1Score=10, player2Score=25, mode="walls", duration=120, timestamp=int(time.time()) - 3600
    ),
    "r2": GameResult(
        id="r2", player1="DemoPlayer", player2="ProGamer", winner="DemoPlayer",
        player1Score=15, player2Score=10, mode="pass-through", duration=90, timestamp=int(time.time()) - 7200
    ),
}
GAME_ROOMS: Dict[str, GameRoom] = {
    "room1": GameRoom(
        id="room1", hostUsername="ProGamer", mode="walls", status="waiting",
        players=["ProGamer"], maxPlayers=2
    )
}
LIVE_GAMES: Dict[str, LiveGame] = {
    "live1": LiveGame(
        id="live1", player1="DemoPlayer", player2="ProGamer",
        player1Score=5, player2Score=8, mode="walls",
        timeRemaining=45, player1Alive=True, player2Alive=True
    )
}


def create_user(username: str, email: str) -> User:
    user_id = str(uuid.uuid4())
    user = User(id=user_id, username=username, email=email)
    USERS[user_id] = user
    return user


def authenticate_user(email: str, password: str):
    # In the mock DB, password is not stored; we accept demo credentials
    for user in USERS.values():
        if user.email == email:
            return user
    return None


def issue_token_for_user(user_id: str) -> str:
    token = str(uuid.uuid4())
    TOKENS[token] = user_id
    return token


def get_user_by_token(token: str):
    user_id = TOKENS.get(token)
    if not user_id:
        return None
    return USERS.get(user_id)


def save_game_result(data: dict) -> GameResult:
    rid = str(uuid.uuid4())
    timestamp = int(time.time())
    result = GameResult(id=rid, timestamp=timestamp, **data)
    GAME_RESULTS[rid] = result
    return result


def create_room(hostUsername: str, mode: str, maxPlayers: int = 2) -> GameRoom:
    rid = str(uuid.uuid4())
    room = GameRoom(id=rid, hostUsername=hostUsername, mode=mode, status="waiting", players=[hostUsername], maxPlayers=maxPlayers)
    GAME_ROOMS[rid] = room
    return room


def get_room(room_id: str):
    return GAME_ROOMS.get(room_id)


def join_room(room_id: str, username: str):
    room = GAME_ROOMS.get(room_id)
    if not room:
        return None, "not_found"
    if len(room.players) >= room.maxPlayers:
        return None, "full"
    if username in room.players:
        return None, "already"
    room.players.append(username)
    return room, None


def leave_room(room_id: str, username: str):
    room = GAME_ROOMS.get(room_id)
    if not room:
        return False
    if username in room.players:
        room.players.remove(username)
    return True
