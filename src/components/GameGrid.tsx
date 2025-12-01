import { GameState } from '@/types/game';

interface GameGridProps {
  gameState: GameState;
}

export const GameGrid = ({ gameState }: GameGridProps) => {
  const cellSize = 100 / gameState.gridSize;

  return (
    <div className="relative w-full aspect-square bg-game-grid rounded-lg border-2 border-primary/30 shadow-glow overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 grid" style={{
        gridTemplateColumns: `repeat(${gameState.gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gameState.gridSize}, 1fr)`,
      }}>
        {Array.from({ length: gameState.gridSize * gameState.gridSize }).map((_, i) => (
          <div key={i} className="border border-border/10" />
        ))}
      </div>

      {/* Food */}
      {gameState.food.map((food, index) => (
        <div
          key={`food-${index}`}
          className="absolute rounded-full bg-game-food shadow-glow-accent animate-pulse-glow transition-all duration-100"
          style={{
            left: `${food.position.x * cellSize}%`,
            top: `${food.position.y * cellSize}%`,
            width: `${cellSize}%`,
            height: `${cellSize}%`,
            padding: '10%',
          }}
        >
          <div className="w-full h-full rounded-full bg-game-food" />
        </div>
      ))}

      {/* Snakes */}
      {gameState.snakes.map((snake) => (
        <div key={snake.id}>
          {snake.body.map((segment, index) => {
            const isHead = index === 0;
            return (
              <div
                key={`${snake.id}-${index}`}
                className={`absolute rounded-sm transition-all duration-100 ${
                  snake.color === 'snake1' ? 'bg-game-snake1' : 'bg-game-snake2'
                } ${isHead ? 'shadow-glow z-10' : 'opacity-90'}`}
                style={{
                  left: `${segment.x * cellSize}%`,
                  top: `${segment.y * cellSize}%`,
                  width: `${cellSize}%`,
                  height: `${cellSize}%`,
                  padding: isHead ? '20%' : '25%',
                }}
              >
                <div className={`w-full h-full rounded-sm ${
                  snake.color === 'snake1' ? 'bg-game-snake1' : 'bg-game-snake2'
                }`} />
              </div>
            );
          })}
        </div>
      ))}

      {/* Game Over Overlay */}
      {gameState.status === 'finished' && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center animate-fade-in">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-primary">Game Over!</h2>
            <p className="text-2xl text-foreground">
              {gameState.winner === 'Draw' ? "It's a Draw!" : `${gameState.winner} Wins!`}
            </p>
            <div className="flex gap-8 justify-center text-lg">
              <div>
                <p className="text-muted-foreground">Player 1</p>
                <p className="text-game-snake1 font-bold text-2xl">{gameState.snakes[0].score}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Player 2</p>
                <p className="text-game-snake2 font-bold text-2xl">{gameState.snakes[1].score}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
