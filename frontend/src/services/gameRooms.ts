// Game room management service
import { GameRoom, GameMode } from '@/types/game';

// Helper for making authenticated requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const gameRoomApi = {
  createRoom: async (hostUsername: string, mode: GameMode): Promise<GameRoom> => {
    const res = await fetch('/rooms', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ hostUsername, mode }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create room');
    }
    return await res.json();
  },

  joinRoom: async (roomCode: string, username: string): Promise<GameRoom> => {
    const res = await fetch(`/rooms/${roomCode}/join`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to join room');
    }
    return await res.json();
  },

  getRoom: async (roomCode: string): Promise<GameRoom | null> => {
    const res = await fetch(`/rooms/${roomCode}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch room');
    return await res.json();
  },

  startGame: async (roomCode: string): Promise<void> => {
    const res = await fetch(`/rooms/${roomCode}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to start game');
  },

  leaveRoom: async (roomCode: string, username: string): Promise<void> => {
    await fetch(`/rooms/${roomCode}/leave`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ username }),
    });
  },
};
