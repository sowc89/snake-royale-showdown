from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
import uuid
import time
from typing import Optional, List, Tuple

from . import models, schemas

# In-memory token storage (for simplicity, could be Redis or DB table)
TOKENS = {}

async def create_user(db: AsyncSession, username: str, email: str) -> models.User:
    user_id = str(uuid.uuid4())
    db_user = models.User(id=user_id, username=username, email=email)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[models.User]:
    # Password check is still mock (accepts any password if email exists)
    result = await db.execute(select(models.User).where(models.User.email == email))
    return result.scalars().first()

def issue_token_for_user(user_id: str) -> str:
    token = str(uuid.uuid4())
    TOKENS[token] = user_id
    return token

async def get_user_by_token(db: AsyncSession, token: str) -> Optional[models.User]:
    user_id = TOKENS.get(token)
    if not user_id:
        return None
    result = await db.execute(select(models.User).where(models.User.id == user_id))
    return result.scalars().first()

async def save_game_result(db: AsyncSession, data: dict) -> models.GameResult:
    rid = str(uuid.uuid4())
    timestamp = int(time.time())
    result = models.GameResult(id=rid, timestamp=timestamp, **data)
    db.add(result)
    await db.commit()
    await db.refresh(result)
    return result

async def get_leaderboard(db: AsyncSession) -> List[schemas.LeaderboardEntry]:
    # Calculate leaderboard from game results
    result = await db.execute(select(models.GameResult))
    game_results = result.scalars().all()

    player_stats = {}
    for res in game_results:
        for player, score in [(res.player1, res.player1Score), (res.player2, res.player2Score)]:
            if player not in player_stats:
                player_stats[player] = {"wins": 0, "games": 0, "highestScore": 0}
            
            stats = player_stats[player]
            stats["games"] += 1
            stats["highestScore"] = max(stats["highestScore"], score)
            if res.winner == player:
                stats["wins"] += 1

    entries = []
    for username, stats in player_stats.items():
        win_rate = (stats["wins"] / stats["games"]) * 100 if stats["games"] > 0 else 0
        entries.append(schemas.LeaderboardEntry(
            rank=0,
            username=username,
            wins=stats["wins"],
            totalGames=stats["games"],
            highestScore=stats["highestScore"],
            winRate=win_rate
        ))
    
    # Sort by wins, then winRate, then highestScore
    entries.sort(key=lambda x: (x.wins, x.winRate, x.highestScore), reverse=True)
    for i, entry in enumerate(entries):
        entry.rank = i + 1
        
    return entries

async def create_room(db: AsyncSession, hostUsername: str, mode: str, maxPlayers: int = 2) -> models.GameRoom:
    rid = str(uuid.uuid4())
    room = models.GameRoom(
        id=rid, 
        hostUsername=hostUsername, 
        mode=mode, 
        status="waiting", 
        players=[hostUsername], 
        maxPlayers=maxPlayers
    )
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room

async def get_room(db: AsyncSession, room_id: str) -> Optional[models.GameRoom]:
    result = await db.execute(select(models.GameRoom).where(models.GameRoom.id == room_id))
    return result.scalars().first()

async def join_room(db: AsyncSession, room_id: str, username: str) -> Tuple[Optional[models.GameRoom], Optional[str]]:
    room = await get_room(db, room_id)
    if not room:
        return None, "not_found"
    
    # Need to handle JSON list mutation carefully with SQLAlchemy
    current_players = list(room.players)
    
    if len(current_players) >= room.maxPlayers:
        return None, "full"
    if username in current_players:
        return None, "already"
    
    current_players.append(username)
    room.players = current_players
    
    await db.commit()
    await db.refresh(room)
    return room, None

async def leave_room(db: AsyncSession, room_id: str, username: str) -> bool:
    room = await get_room(db, room_id)
    if not room:
        return False
    
    current_players = list(room.players)
    if username in current_players:
        current_players.remove(username)
        room.players = current_players
        
        if len(current_players) == 0 or username == room.hostUsername:
             await db.delete(room)
        
        await db.commit()
        return True
    return True # Or False if user wasn't in room? Logic says success if they are gone.

async def start_room(db: AsyncSession, room_id: str):
    room = await get_room(db, room_id)
    if room:
        room.status = "in-progress"
        await db.commit()

async def get_live_games(db: AsyncSession) -> List[models.LiveGame]:
    result = await db.execute(select(models.LiveGame))
    return result.scalars().all()
