import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GameGrid } from '@/components/GameGrid';
import { useGameEngine } from '@/hooks/useGameEngine';
import { authApi, gameApi } from '@/services/api';
import { gameRoomApi } from '@/services/gameRooms';
import { GameMode, PlayerMode } from '@/types/game';
import { ArrowLeft, Play, Pause, Users } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function Game() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');
  const modeParam = searchParams.get('mode') as GameMode | null;
  
  const [user] = useState(authApi.getCurrentUser() || { username: 'Guest', email: '' });
  const [selectedMode, setSelectedMode] = useState<GameMode>(modeParam || 'walls');
  const [playerMode, setPlayerMode] = useState<PlayerMode>('single');
  const [gameStarted, setGameStarted] = useState(false);
  const [setupStep, setSetupStep] = useState<'player-mode' | 'game-mode' | 'ready'>('player-mode');
  const [player2Name, setPlayer2Name] = useState<string>('AI Opponent');

  // Load room data if joining from lobby
  useEffect(() => {
    if (roomCode) {
      const room = gameRoomApi.getRoom(roomCode);
      if (room && room.players.length === 2) {
        setPlayerMode('multiplayer');
        setSelectedMode(room.mode);
        setPlayer2Name(room.players.find(p => p !== user?.username) || 'Player 2');
        setSetupStep('ready');
      }
    }
  }, [roomCode, user]);

  const { gameState, startGame, pauseGame, resumeGame, changeDirection } = useGameEngine(
    selectedMode,
    playerMode,
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

  // Save game result when finished (only for multiplayer)
  useEffect(() => {
    if (gameState.status === 'finished' && gameStarted && playerMode === 'multiplayer') {
      const saveResult = async () => {
        try {
          await gameApi.saveGameResult({
            player1: user?.username || 'Player 1',
            player2: player2Name,
            winner: gameState.winner || 'Draw',
            player1Score: gameState.snakes[0].score,
            player2Score: gameState.snakes.length > 1 ? gameState.snakes[1].score : 0,
            mode: selectedMode,
            duration: 60 - gameState.timeRemaining,
          });
        } catch (error) {
          console.error('Failed to save game result:', error);
        }
      };
      saveResult();
    }
  }, [gameState.status, gameState.winner, gameStarted, playerMode, user, player2Name, selectedMode, gameState.snakes, gameState.timeRemaining]);

  const handleStartGame = () => {
    if (setupStep !== 'ready') return;
    setGameStarted(true);
    startGame();
    toast({
      title: 'Game Started!',
      description: 'Good luck!',
    });
  };

  const handleCreateMultiplayerRoom = () => {
    if (!user) return;
    const room = gameRoomApi.createRoom(user.username, selectedMode);
    navigate(`/lobby?room=${room.id}`);
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

        {/* Player Mode Selection */}
        {!gameStarted && setupStep === 'player-mode' && (
          <Card className="p-6 border-primary/20 shadow-glow animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Select Play Mode</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setPlayerMode('single');
                  setSetupStep('game-mode');
                }}
                className="p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">Single Player</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Play solo and try to beat your high score
                  </p>
                </div>
              </button>
              <button
                onClick={() => {
                  setPlayerMode('multiplayer');
                  setSetupStep('game-mode');
                }}
                className="p-6 rounded-lg border-2 border-border hover:border-secondary/50 transition-all group"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                    <Users className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="font-bold text-foreground text-xl">Multiplayer</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    Battle against another player in real-time
                  </p>
                </div>
              </button>
            </div>
          </Card>
        )}

        {/* Game Mode Selection */}
        {!gameStarted && setupStep === 'game-mode' && (
          <Card className="p-6 border-primary/20 shadow-glow animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSetupStep('player-mode')}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h2 className="text-2xl font-bold text-foreground">Select Game Mode</h2>
              <div className="w-20" />
            </div>
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
            {playerMode === 'single' ? (
              <Button
                onClick={() => setSetupStep('ready')}
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-lg h-12"
              >
                Continue
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handleCreateMultiplayerRoom}
                  className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-lg h-12"
                >
                  Create Room & Invite Friend
                </Button>
                <Button
                  onClick={() => navigate('/lobby')}
                  variant="outline"
                  className="w-full border-primary/30 hover:border-primary/50 text-lg h-12"
                >
                  Join Existing Room
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Ready to Start */}
        {!gameStarted && setupStep === 'ready' && (
          <Card className="p-6 border-primary/20 shadow-glow animate-fade-in">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold text-foreground">Ready to Play!</h2>
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Mode: <span className="text-foreground font-medium capitalize">{selectedMode.replace('-', ' ')}</span>
                </p>
                <p className="text-muted-foreground">
                  Players: <span className="text-foreground font-medium">{playerMode === 'single' ? '1 Player' : '2 Players'}</span>
                </p>
              </div>
              <Button
                onClick={handleStartGame}
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-xl h-14 mt-6"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Game
              </Button>
            </div>
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
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Players</p>
                    <p className="text-lg font-medium text-foreground">
                      {playerMode === 'single' ? 'Single Player' : 'Multiplayer'}
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
                  {playerMode === 'multiplayer' && gameState.snakes.length > 1 && (
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
                  )}
                </div>
              </Card>

              <Card className="p-6 border-border/30">
                <h3 className="text-lg font-bold text-foreground mb-3">Controls</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground mb-1">{playerMode === 'single' ? 'Controls' : 'Player 1'}</p>
                    <p className="text-muted-foreground">Arrow Keys: ↑ ↓ ← →</p>
                  </div>
                  {playerMode === 'multiplayer' && (
                    <div>
                      <p className="font-medium text-foreground mb-1">Player 2</p>
                      <p className="text-muted-foreground">WASD Keys</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
