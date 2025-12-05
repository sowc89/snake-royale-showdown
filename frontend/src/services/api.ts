// Centralized API service layer - all backend calls go through here

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface GameMode {
  id: 'pass-through' | 'walls';
  name: string;
  description: string;
}

export interface GameResult {
  id: string;
  player1: string;
  player2: string;
  winner: string;
  player1Score: number;
  player2Score: number;
  mode: GameMode['id'];
  duration: number;
  timestamp: number;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  wins: number;
  totalGames: number;
  highestScore: number;
  winRate: number;
}

export interface LiveGame {
  id: string;
  player1: string;
  player2: string;
  player1Score: number;
  player2Score: number;
  mode: GameMode['id'];
  timeRemaining: number;
  player1Alive: boolean;
  player2Alive: boolean;
}

// Helper for making authenticated requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return data;
  },

  signup: async (email: string, password: string, username: string): Promise<{ user: User; token: string }> => {
    const res = await fetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Signup failed');
    }
    const data = await res.json();
    localStorage.setItem('token', data.token);
    return data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('token');
    if (token) {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      localStorage.removeItem('token');
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const res = await fetch('/auth/me', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        localStorage.removeItem('token');
        return null;
      }
      return await res.json();
    } catch (e) {
      localStorage.removeItem('token');
      return null;
    }
  },
};

// Game API
export const gameApi = {
  getGameModes: async (): Promise<GameMode[]> => {
    const res = await fetch('/modes');
    if (!res.ok) throw new Error('Failed to fetch modes');
    return await res.json();
  },

  saveGameResult: async (result: Omit<GameResult, 'id' | 'timestamp'>): Promise<GameResult> => {
    const res = await fetch('/games/results', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(result),
    });
    if (!res.ok) throw new Error('Failed to save result');
    return await res.json();
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const res = await fetch('/leaderboard');
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return await res.json();
  },

  getLiveGames: async (): Promise<LiveGame[]> => {
    const res = await fetch('/live-games');
    if (!res.ok) throw new Error('Failed to fetch live games');
    return await res.json();
  },
};
