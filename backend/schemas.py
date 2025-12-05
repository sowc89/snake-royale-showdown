from typing import List, Optional
from pydantic import BaseModel, EmailStr
from enum import Enum


class GameModeEnum(str, Enum):
    pass_through = "pass-through"
    walls = "walls"


class User(BaseModel):
    id: str
    username: str
    email: EmailStr


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


class SignupRequest(AuthRequest):
    username: str


class AuthResponse(BaseModel):
    user: User
    token: str


class GameResult(BaseModel):
    id: str
    player1: str
    player2: str
    winner: str
    player1Score: int
    player2Score: int
    mode: GameModeEnum
    duration: int
    timestamp: int


class SaveGameResultRequest(BaseModel):
    player1: str
    player2: str
    winner: str
    player1Score: int
    player2Score: int
    mode: GameModeEnum
    duration: int


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    wins: int
    totalGames: int
    highestScore: int
    winRate: float


class LiveGame(BaseModel):
    id: str
    player1: str
    player2: str
    player1Score: int
    player2Score: int
    mode: GameModeEnum
    timeRemaining: int
    player1Alive: bool
    player2Alive: bool


class GameRoom(BaseModel):
    id: str
    hostUsername: str
    mode: GameModeEnum
    status: str
    players: List[str]
    maxPlayers: int


class CreateRoomRequest(BaseModel):
    hostUsername: str
    mode: GameModeEnum


class JoinRoomRequest(BaseModel):
    username: str
