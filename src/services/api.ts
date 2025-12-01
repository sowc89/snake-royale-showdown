// Centralized API service layer - all backend calls go through here
// Currently mocked, but can be easily replaced with real API calls

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

// Mock data storage
let currentUser: User | null = null;
const users: Map<string, { email: string; password: string; username: string }> = new Map([
  ['demo@game.com', { email: 'demo@game.com', password: 'demo123', username: 'DemoPlayer' }],
  ['player1@game.com', { email: 'player1@game.com', password: 'pass123', username: 'ProGamer' }],
  ['player2@game.com', { email: 'player2@game.com', password: 'pass123', username: 'SnakeMaster' }],
]);

const gameResults: GameResult[] = [
  {
    id: '1',
    player1: 'DemoPlayer',
    player2: 'ProGamer',
    winner: 'ProGamer',
    player1Score: 15,
    player2Score: 23,
    mode: 'walls',
    duration: 45,
    timestamp: Date.now() - 3600000,
  },
  {
    id: '2',
    player1: 'SnakeMaster',
    player2: 'DemoPlayer',
    winner: 'SnakeMaster',
    player1Score: 31,
    player2Score: 18,
    mode: 'pass-through',
    duration: 60,
    timestamp: Date.now() - 7200000,
  },
  {
    id: '3',
    player1: 'ProGamer',
    player2: 'SnakeMaster',
    winner: 'ProGamer',
    player1Score: 27,
    player2Score: 24,
    mode: 'walls',
    duration: 58,
    timestamp: Date.now() - 10800000,
  },
];

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    const userRecord = users.get(email);
    if (!userRecord || userRecord.password !== password) {
      throw new Error('Invalid credentials');
    }

    currentUser = {
      id: Math.random().toString(36).substr(2, 9),
      username: userRecord.username,
      email: userRecord.email,
    };

    return {
      user: currentUser,
      token: 'mock-jwt-token',
    };
  },

  signup: async (email: string, password: string, username: string): Promise<{ user: User; token: string }> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    if (users.has(email)) {
      throw new Error('Email already exists');
    }

    users.set(email, { email, password, username });
    currentUser = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      email,
    };

    return {
      user: currentUser,
      token: 'mock-jwt-token',
    };
  },

  logout: async (): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    currentUser = null;
  },

  getCurrentUser: (): User | null => {
    return currentUser;
  },
};

// Game API
export const gameApi = {
  getGameModes: async (): Promise<GameMode[]> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return [
      {
        id: 'pass-through',
        name: 'Pass-Through',
        description: 'Snakes can pass through walls and appear on the opposite side',
      },
      {
        id: 'walls',
        name: 'Walls',
        description: 'Traditional mode - hitting walls ends the game',
      },
    ];
  },

  saveGameResult: async (result: Omit<GameResult, 'id' | 'timestamp'>): Promise<GameResult> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const newResult: GameResult = {
      ...result,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    
    gameResults.unshift(newResult);
    return newResult;
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));

    // Calculate leaderboard from game results
    const playerStats = new Map<string, { wins: number; games: number; highestScore: number }>();

    gameResults.forEach(result => {
      [result.player1, result.player2].forEach(player => {
        if (!playerStats.has(player)) {
          playerStats.set(player, { wins: 0, games: 0, highestScore: 0 });
        }
        const stats = playerStats.get(player)!;
        stats.games++;
        
        if (result.winner === player) {
          stats.wins++;
        }
        
        const playerScore = player === result.player1 ? result.player1Score : result.player2Score;
        stats.highestScore = Math.max(stats.highestScore, playerScore);
      });
    });

    const leaderboard: LeaderboardEntry[] = Array.from(playerStats.entries())
      .map(([username, stats]) => ({
        rank: 0,
        username,
        wins: stats.wins,
        totalGames: stats.games,
        highestScore: stats.highestScore,
        winRate: (stats.wins / stats.games) * 100,
      }))
      .sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.highestScore - a.highestScore;
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return leaderboard;
  },

  getLiveGames: async (): Promise<LiveGame[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    // Generate mock live games
    const mockGames: LiveGame[] = [
      {
        id: 'live-1',
        player1: 'ProGamer',
        player2: 'SnakeMaster',
        player1Score: 12,
        player2Score: 15,
        mode: 'walls',
        timeRemaining: 45,
        player1Alive: true,
        player2Alive: true,
      },
      {
        id: 'live-2',
        player1: 'NeonViper',
        player2: 'GridRunner',
        player1Score: 8,
        player2Score: 6,
        mode: 'pass-through',
        timeRemaining: 30,
        player1Alive: true,
        player2Alive: true,
      },
    ];

    return mockGames;
  },
};
