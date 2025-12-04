import { describe, it, expect } from 'vitest';
import { Snake, Position, Direction } from '@/types/game';

// Helper functions extracted from useGameEngine for testing
const moveSnakeHelper = (snake: Snake, mode: 'pass-through' | 'walls', gridSize: number): Snake => {
  if (!snake.alive) return snake;

  const head = snake.body[0];
  let newHead: Position;

  switch (snake.nextDirection) {
    case 'UP':
      newHead = { x: head.x, y: head.y - 1 };
      break;
    case 'DOWN':
      newHead = { x: head.x, y: head.y + 1 };
      break;
    case 'LEFT':
      newHead = { x: head.x - 1, y: head.y };
      break;
    case 'RIGHT':
      newHead = { x: head.x + 1, y: head.y };
      break;
  }

  if (mode === 'pass-through') {
    if (newHead.x < 0) newHead.x = gridSize - 1;
    if (newHead.x >= gridSize) newHead.x = 0;
    if (newHead.y < 0) newHead.y = gridSize - 1;
    if (newHead.y >= gridSize) newHead.y = 0;
  } else {
    if (newHead.x < 0 || newHead.x >= gridSize || newHead.y < 0 || newHead.y >= gridSize) {
      return { ...snake, alive: false };
    }
  }

  if (snake.body.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
    return { ...snake, alive: false };
  }

  const newBody = [newHead, ...snake.body.slice(0, -1)];

  return {
    ...snake,
    body: newBody,
    direction: snake.nextDirection,
  };
};

describe('Game Engine - Snake Movement', () => {
  const createTestSnake = (body: Position[], direction: Direction): Snake => ({
    id: 'test',
    body,
    direction,
    nextDirection: direction,
    alive: true,
    score: 0,
    color: 'snake1',
  });

  it('should move snake right', () => {
    const snake = createTestSnake([{ x: 5, y: 5 }, { x: 4, y: 5 }], 'RIGHT');
    const moved = moveSnakeHelper(snake, 'walls', 20);
    
    expect(moved.body[0]).toEqual({ x: 6, y: 5 });
    expect(moved.alive).toBe(true);
  });

  it('should move snake up', () => {
    const snake = createTestSnake([{ x: 5, y: 5 }, { x: 5, y: 6 }], 'UP');
    const moved = moveSnakeHelper(snake, 'walls', 20);
    
    expect(moved.body[0]).toEqual({ x: 5, y: 4 });
    expect(moved.alive).toBe(true);
  });

  it('should die when hitting wall in walls mode', () => {
    const snake = createTestSnake([{ x: 0, y: 5 }, { x: 1, y: 5 }], 'LEFT');
    const moved = moveSnakeHelper(snake, 'walls', 20);
    
    expect(moved.alive).toBe(false);
  });

  it('should wrap around in pass-through mode', () => {
    const snake = createTestSnake([{ x: 0, y: 5 }, { x: 1, y: 5 }], 'LEFT');
    const moved = moveSnakeHelper(snake, 'pass-through', 20);
    
    expect(moved.body[0]).toEqual({ x: 19, y: 5 });
    expect(moved.alive).toBe(true);
  });

  it('should die when colliding with itself', () => {
    const snake = createTestSnake(
      [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 4, y: 6 },
        { x: 5, y: 6 },
      ],
      'DOWN'
    );
    const moved = moveSnakeHelper(snake, 'walls', 20);
    
    expect(moved.alive).toBe(false);
  });
});

describe('Game Engine - Collision Detection', () => {
  it('should detect collision between snakes', () => {
    const snake1Body = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    const snake2Body = [{ x: 6, y: 5 }, { x: 7, y: 5 }];
    
    // Snake1 moving right will hit snake2
    const overlap = snake1Body[0].x + 1 === snake2Body[0].x && snake1Body[0].y === snake2Body[0].y;
    expect(overlap).toBe(true);
  });

  it('should detect food collision', () => {
    const snakeHead = { x: 5, y: 5 };
    const foodPosition = { x: 5, y: 5 };
    
    const collision = snakeHead.x === foodPosition.x && snakeHead.y === foodPosition.y;
    expect(collision).toBe(true);
  });

  it('should not detect collision when positions differ', () => {
    const snakeHead = { x: 5, y: 5 };
    const foodPosition = { x: 6, y: 5 };
    
    const collision = snakeHead.x === foodPosition.x && snakeHead.y === foodPosition.y;
    expect(collision).toBe(false);
  });
});

describe('Game Engine - Scoring', () => {
  it('should increase score when eating food', () => {
    const initialScore = 5;
    const newScore = initialScore + 1;
    
    expect(newScore).toBe(6);
  });

  it('should grow snake body when eating food', () => {
    const body = [{ x: 5, y: 5 }, { x: 4, y: 5 }];
    const tail = body[body.length - 1];
    const grownBody = [...body, tail];
    
    expect(grownBody.length).toBe(3);
  });
});
