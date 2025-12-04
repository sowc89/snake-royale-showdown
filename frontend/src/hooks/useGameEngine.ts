import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Snake, Direction, Position, GameMode, Food, PlayerMode } from '@/types/game';

const GRID_SIZE = 20;
const TICK_RATE = 150; // ms per game tick
const GAME_DURATION = 60; // seconds

const INITIAL_SNAKE_1: Position[] = [{ x: 5, y: 10 }];
const INITIAL_SNAKE_2: Position[] = [{ x: 15, y: 10 }];

const createInitialState = (mode: GameMode, playerMode: PlayerMode): GameState => ({
  snakes: playerMode === 'single' 
    ? [
        {
          id: 'player1',
          body: [...INITIAL_SNAKE_1],
          direction: 'RIGHT',
          nextDirection: 'RIGHT',
          alive: true,
          score: 0,
          color: 'snake1',
        }
      ]
    : [
        {
          id: 'player1',
          body: [...INITIAL_SNAKE_1],
          direction: 'RIGHT',
          nextDirection: 'RIGHT',
          alive: true,
          score: 0,
          color: 'snake1',
        },
        {
          id: 'player2',
          body: [...INITIAL_SNAKE_2],
          direction: 'LEFT',
          nextDirection: 'LEFT',
          alive: true,
          score: 0,
          color: 'snake2',
        },
      ],
  food: [],
  gridSize: GRID_SIZE,
  mode,
  playerMode,
  status: 'waiting',
  timeRemaining: GAME_DURATION,
  winner: null,
});

export const useGameEngine = (mode: GameMode, playerMode: PlayerMode, player1Name: string, player2Name?: string) => {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState(mode, playerMode));

  // Update game state when mode changes (to reflect mode selection before game starts)
  useEffect(() => {
    if (gameState.status === 'waiting') {
      setGameState(prev => ({
        ...prev,
        mode,
      }));
    }
  }, [mode, gameState.status]);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate random food position
  const generateFood = useCallback((snakes: Snake[]): Position => {
    let position: Position;
    let isValid = false;

    while (!isValid) {
      position = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };

      isValid = !snakes.some(snake =>
        snake.body.some(segment => segment.x === position.x && segment.y === position.y)
      );
    }

    return position!;
  }, []);

  // Initialize food
  useEffect(() => {
    if (gameState.food.length === 0 && gameState.status !== 'finished') {
      const foodPositions: Food[] = [
        { position: generateFood(gameState.snakes) },
        { position: generateFood(gameState.snakes) },
      ];
      setGameState(prev => ({ ...prev, food: foodPositions }));
    }
  }, [gameState.food.length, gameState.snakes, gameState.status, generateFood]);

  // Move snake
  const moveSnake = useCallback((snake: Snake, mode: GameMode): Snake => {
    if (!snake.alive) return snake;

    const head = snake.body[0];
    let newHead: Position;

    // Calculate new head position based on direction
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

    // Handle wall collision based on mode
    if (mode === 'pass-through') {
      // Wrap around
      if (newHead.x < 0) newHead.x = GRID_SIZE - 1;
      if (newHead.x >= GRID_SIZE) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID_SIZE - 1;
      if (newHead.y >= GRID_SIZE) newHead.y = 0;
    } else {
      // Check wall collision
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        return { ...snake, alive: false };
      }
    }

    // Check self collision
    if (snake.body.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
      return { ...snake, alive: false };
    }

    const newBody = [newHead, ...snake.body.slice(0, -1)];

    return {
      ...snake,
      body: newBody,
      direction: snake.nextDirection,
    };
  }, []);

  // Check collisions between snakes
  const checkSnakeCollisions = useCallback((snakes: Snake[]): Snake[] => {
    return snakes.map(snake => {
      if (!snake.alive) return snake;

      const head = snake.body[0];
      const otherSnakes = snakes.filter(s => s.id !== snake.id);

      // Check collision with other snakes' bodies
      for (const otherSnake of otherSnakes) {
        if (otherSnake.body.some(segment => segment.x === head.x && segment.y === head.y)) {
          return { ...snake, alive: false };
        }
      }

      return snake;
    });
  }, []);

  // Check food collision
  const checkFoodCollision = useCallback((snakes: Snake[], food: Food[]): { snakes: Snake[]; food: Food[] } => {
    let newFood = [...food];
    const newSnakes = snakes.map(snake => {
      if (!snake.alive) return snake;

      const head = snake.body[0];
      const foodIndex = newFood.findIndex(f => f.position.x === head.x && f.position.y === head.y);

      if (foodIndex !== -1) {
        // Snake ate food
        newFood.splice(foodIndex, 1);
        return {
          ...snake,
          body: [...snake.body, snake.body[snake.body.length - 1]],
          score: snake.score + 1,
        };
      }

      return snake;
    });

    // Add new food if needed
    while (newFood.length < 2) {
      newFood.push({ position: generateFood(newSnakes) });
    }

    return { snakes: newSnakes, food: newFood };
  }, [generateFood]);

  // Game tick
  const gameTick = useCallback(() => {
    setGameState(prev => {
      if (prev.status !== 'playing') return prev;

      // Move snakes
      let newSnakes = prev.snakes.map(snake => moveSnake(snake, prev.mode));

      // Check collisions
      newSnakes = checkSnakeCollisions(newSnakes);

      // Check food
      const { snakes: snakesAfterFood, food: newFood } = checkFoodCollision(newSnakes, prev.food);

      // Check if game should end
      const aliveSnakes = snakesAfterFood.filter(s => s.alive);
      
      // Single player: game ends when player dies or time runs out
      if (prev.playerMode === 'single') {
        if (aliveSnakes.length === 0 || prev.timeRemaining <= 0) {
          return {
            ...prev,
            snakes: snakesAfterFood,
            food: newFood,
            status: 'finished',
            winner: aliveSnakes.length > 0 ? player1Name : 'Game Over',
          };
        }
      } 
      // Multiplayer: game ends when one or fewer snakes remain or time runs out
      else if (aliveSnakes.length <= 1 || prev.timeRemaining <= 0) {
        const winner = aliveSnakes.length === 1
          ? (aliveSnakes[0].id === 'player1' ? player1Name : player2Name || 'Player 2')
          : snakesAfterFood[0].score > snakesAfterFood[1].score
            ? player1Name
            : snakesAfterFood[0].score < snakesAfterFood[1].score
              ? (player2Name || 'Player 2')
              : 'Draw';

        return {
          ...prev,
          snakes: snakesAfterFood,
          food: newFood,
          status: 'finished',
          winner,
        };
      }

      return {
        ...prev,
        snakes: snakesAfterFood,
        food: newFood,
      };
    });
  }, [moveSnake, checkSnakeCollisions, checkFoodCollision, player1Name, player2Name]);

  // Start game
  const startGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  // Pause game
  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'paused' }));
  }, []);

  // Resume game
  const resumeGame = useCallback(() => {
    setGameState(prev => ({ ...prev, status: 'playing' }));
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState(createInitialState(mode, playerMode));
  }, [mode, playerMode]);

  // Change direction
  const changeDirection = useCallback((snakeId: string, direction: Direction) => {
    setGameState(prev => ({
      ...prev,
      snakes: prev.snakes.map(snake => {
        if (snake.id !== snakeId) return snake;

        // Prevent 180-degree turns
        const opposites: Record<Direction, Direction> = {
          UP: 'DOWN',
          DOWN: 'UP',
          LEFT: 'RIGHT',
          RIGHT: 'LEFT',
        };

        if (direction === opposites[snake.direction]) {
          return snake;
        }

        return { ...snake, nextDirection: direction };
      }),
    }));
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.status === 'playing') {
      gameLoopRef.current = setInterval(gameTick, TICK_RATE);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameState.status, gameTick]);

  // Timer
  useEffect(() => {
    if (gameState.status === 'playing') {
      timerRef.current = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: Math.max(0, prev.timeRemaining - 1),
        }));
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [gameState.status]);

  return {
    gameState,
    startGame,
    pauseGame,
    resumeGame,
    resetGame,
    changeDirection,
  };
};
