export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameMode = 'pass-through' | 'walls';
export type GameStatus = 'waiting' | 'playing' | 'paused' | 'finished';

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
  status: GameStatus;
  timeRemaining: number;
  winner: string | null;
}
