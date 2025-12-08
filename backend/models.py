from sqlalchemy import Column, Integer, String, Boolean, Float, JSON
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)


class GameResult(Base):
    __tablename__ = "game_results"

    id = Column(String, primary_key=True, index=True)
    player1 = Column(String)
    player2 = Column(String)
    winner = Column(String)
    player1Score = Column(Integer)
    player2Score = Column(Integer)
    mode = Column(String)
    duration = Column(Integer)
    timestamp = Column(Integer)


class GameRoom(Base):
    __tablename__ = "game_rooms"

    id = Column(String, primary_key=True, index=True)
    hostUsername = Column(String)
    mode = Column(String)
    status = Column(String)
    players = Column(JSON)  # Store list of strings as JSON
    maxPlayers = Column(Integer)


class LiveGame(Base):
    __tablename__ = "live_games"

    id = Column(String, primary_key=True, index=True)
    player1 = Column(String)
    player2 = Column(String)
    player1Score = Column(Integer)
    player2Score = Column(Integer)
    mode = Column(String)
    timeRemaining = Column(Integer)
    player1Alive = Column(Boolean)
    player2Alive = Column(Boolean)
