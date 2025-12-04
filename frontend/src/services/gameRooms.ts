// Mock game room management service
import { GameRoom, GameMode } from '@/types/game';

const gameRooms = new Map<string, GameRoom>();

// Generate random 6-character room code
const generateRoomCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const gameRoomApi = {
  createRoom: (hostUsername: string, mode: GameMode): GameRoom => {
    const roomCode = generateRoomCode();
    const room: GameRoom = {
      id: roomCode,
      hostUsername,
      mode,
      status: 'waiting',
      players: [hostUsername],
      maxPlayers: 2,
    };
    
    gameRooms.set(roomCode, room);
    return room;
  },

  joinRoom: (roomCode: string, username: string): GameRoom | null => {
    const room = gameRooms.get(roomCode.toUpperCase());
    
    if (!room) {
      throw new Error('Room not found');
    }
    
    if (room.status !== 'waiting') {
      throw new Error('Game already in progress');
    }
    
    if (room.players.length >= room.maxPlayers) {
      throw new Error('Room is full');
    }
    
    if (room.players.includes(username)) {
      throw new Error('You are already in this room');
    }
    
    room.players.push(username);
    return room;
  },

  getRoom: (roomCode: string): GameRoom | null => {
    return gameRooms.get(roomCode.toUpperCase()) || null;
  },

  startGame: (roomCode: string): void => {
    const room = gameRooms.get(roomCode.toUpperCase());
    if (room) {
      room.status = 'in-progress';
    }
  },

  leaveRoom: (roomCode: string, username: string): void => {
    const room = gameRooms.get(roomCode.toUpperCase());
    if (room) {
      room.players = room.players.filter(p => p !== username);
      
      // Delete room if empty or if host leaves
      if (room.players.length === 0 || username === room.hostUsername) {
        gameRooms.delete(roomCode.toUpperCase());
      }
    }
  },
};
