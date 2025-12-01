import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameGrid } from '@/components/GameGrid';
import { useGameEngine } from '@/hooks/useGameEngine';
import { authApi, gameApi } from '@/services/api';
import { GameMode } from '@/types/game';
import { ArrowLeft, Play, Pause } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Game() {
  const navigate = useNavigate();
  const [user] = useState(authApi.getCurrentUser());
  const [selectedMode, setSelectedMode] = useState<GameMode>('walls');
  const [gameStarted, setGameStarted] = useState(false);
  const [player2Name] = useState('AI Opponent');

  const { gameState, startGame, pauseGame, resumeGame, changeDirection } = useGameEngine(
    selectedMode,
    user?.username || 'Player 1',
    player2Name
  );

  // Keyboard controls
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.status !== 'playing') return;

      // Player 1 controls (Arrow keys)
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          changeDirection('player1', 'UP');
          break;
        case 'ArrowDown':
          e.preventDefault();
          changeDirection('player1', 'DOWN');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          changeDirection('player1', 'LEFT');
          break;
        case 'ArrowRight':
          e.preventDefault();
          changeDirection('player1', 'RIGHT');
          break;
        // Player 2 controls (WASD)
        case 'w':
        case 'W':
          changeDirection('player2', 'UP');
          break;
        case 's':
        case 'S':
          changeDirection('player2', 'DOWN');
          break;
        case 'a':
        case 'A':
          changeDirection('player2', 'LEFT');
          break;
        case 'd':
        case 'D':
          changeDirection('player2', 'RIGHT');
          break;
      }
    },
    [gameState.status, changeDirection]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Save game result when finished
  useEffect(() => {
    if (gameState.status === 'finished' && gameStarted) {
      const saveResult = async () => {
        try {
          await gameApi.saveGameResult({
            player1: user?.username || 'Player 1',
            player2: player2Name,
            winner: gameState.winner || 'Draw',
            player1Score: gameState.snakes[0].score,
            player2Score: gameState.snakes[1].score,
            mode: selectedMode,
            duration: 60 - gameState.timeRemaining,
          });
        } catch (error) {
          console.error('Failed to save game result:', error);
        }
      };
      saveResult();
    }
  }, [gameState.status, gameState.winner, gameStarted, user, player2Name, selectedMode, gameState.snakes, gameState.timeRemaining]);

  const handleStartGame = () => {
    setGameStarted(true);
    startGame();
    toast({
      title: 'Game Started!',
      description: 'Good luck!',
    });
  };

  const handlePauseResume = () => {
    if (gameState.status === 'playing') {
      pauseGame();
    } else if (gameState.status === 'paused') {
      resumeGame();
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handlePlayAgain = () => {
    window.location.reload();
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      <div className="max-w-6xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBackToDashboard}
            className="border-primary/30 hover:border-primary/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            SNAKE ARENA
          </h1>
          <div className="w-32" /> {/* Spacer for centering */}
        </div>

        {/* Mode Selection */}
        {!gameStarted && (
          <Card className="p-6 border-primary/20 shadow-glow animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Select Game Mode</h2>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => setSelectedMode('walls')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMode === 'walls'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <h3 className="font-bold text-foreground mb-2">Walls Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Traditional snake - hitting walls ends the game
                </p>
              </button>
              <button
                onClick={() => setSelectedMode('pass-through')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedMode === 'pass-through'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <h3 className="font-bold text-foreground mb-2">Pass-Through Mode</h3>
                <p className="text-sm text-muted-foreground">
                  Snakes wrap around and appear on the opposite side
                </p>
              </button>
            </div>
            <Button
              onClick={handleStartGame}
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-lg h-12"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Game
            </Button>
          </Card>
        )}

        {/* Game Area */}
        {gameStarted && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            <div className="space-y-4">
              <GameGrid gameState={gameState} />
              
              <div className="flex gap-4">
                {gameState.status !== 'finished' && (
                  <Button
                    onClick={handlePauseResume}
                    variant="outline"
                    className="border-primary/30 hover:border-primary/50"
                  >
                    {gameState.status === 'playing' ? (
                      <>
                        <Pause className="w-4 h-4 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Resume
                      </>
                    )}
                  </Button>
                )}
                {gameState.status === 'finished' && (
                  <Button
                    onClick={handlePlayAgain}
                    className="bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold"
                  >
                    Play Again
                  </Button>
                )}
              </div>
            </div>

            {/* Game Info Sidebar */}
            <div className="space-y-4">
              <Card className="p-6 border-border/30">
                <h3 className="text-xl font-bold text-foreground mb-4">Game Info</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Time Remaining</p>
                    <p className="text-3xl font-bold text-primary">{gameState.timeRemaining}s</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Mode</p>
                    <p className="text-lg font-medium text-foreground capitalize">
                      {selectedMode.replace('-', ' ')}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/30">
                <h3 className="text-xl font-bold text-foreground mb-4">Scores</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{user.username}</p>
                      <span className={`px-2 py-1 rounded text-xs ${
                        gameState.snakes[0].alive ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {gameState.snakes[0].alive ? 'ALIVE' : 'DEAD'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-game-snake1">{gameState.snakes[0].score}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{player2Name}</p>
                      <span className={`px-2 py-1 rounded text-xs ${
                        gameState.snakes[1].alive ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {gameState.snakes[1].alive ? 'ALIVE' : 'DEAD'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold text-game-snake2">{gameState.snakes[1].score}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/30">
                <h3 className="text-lg font-bold text-foreground mb-3">Controls</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-1">Player 1</p>
                    <p className="text-muted-foreground">Arrow Keys: ↑ ↓ ← →</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground mb-1">Player 2</p>
                    <p className="text-muted-foreground">WASD Keys</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
