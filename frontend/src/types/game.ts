export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameMode = 'pass-through' | 'walls';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';
export type PlayerMode = 'single' | 'multiplayer';

export interface Position {
  x: number;
  y: number;
}

export interface Snake {
  id: string;
  body: Position[];
  direction: Direction;
  nextDirection: Direction;
  alive: boolean;
  score: number;
  color: string;
}

export interface Food {
  position: Position;
}

export interface GameState {
  snakes: Snake[];
  food: Food[];
  gridSize: number;
  mode: GameMode;
  playerMode: PlayerMode;
  status: GameStatus;
  timeRemaining: number;
  winner: string | null;
}

export interface GameRoom {
  id: string;
  hostUsername: string;
  mode: GameMode;
  status: 'waiting' | 'in-progress' | 'finished';
  players: string[];
  maxPlayers: number;
}
