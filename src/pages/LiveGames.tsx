import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { gameApi, LiveGame } from '@/services/api';
import { ArrowLeft, Eye, Clock, Zap } from 'lucide-react';

export default function LiveGames() {
  const navigate = useNavigate();
  const [liveGames, setLiveGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGames = async () => {
      try {
        const data = await gameApi.getLiveGames();
        setLiveGames(data);
      } catch (error) {
        console.error('Failed to fetch live games:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLiveGames();

    // Simulate live updates
    const interval = setInterval(async () => {
      try {
        const data = await gameApi.getLiveGames();
        // Simulate score changes
        const updatedGames = data.map(game => ({
          ...game,
          player1Score: game.player1Score + Math.floor(Math.random() * 2),
          player2Score: game.player2Score + Math.floor(Math.random() * 2),
          timeRemaining: Math.max(0, game.timeRemaining - 1),
        }));
        setLiveGames(updatedGames);
      } catch (error) {
        console.error('Failed to update live games:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="border-primary/30 hover:border-primary/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Live Games
          </h1>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Live indicator */}
        <Card className="p-4 border-accent/30 shadow-glow-accent animate-pulse-glow">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-accent rounded-full animate-ping" />
            </div>
            <div>
              <p className="font-bold text-foreground">
                {liveGames.length} {liveGames.length === 1 ? 'Game' : 'Games'} in Progress
              </p>
              <p className="text-sm text-muted-foreground">Updates in real-time</p>
            </div>
          </div>
        </Card>

        {/* Live Games List */}
        {loading ? (
          <Card className="p-12 border-border/30 text-center">
            <p className="text-muted-foreground">Loading live games...</p>
          </Card>
        ) : liveGames.length === 0 ? (
          <Card className="p-12 border-border/30 text-center animate-fade-in">
            <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No live games at the moment</p>
            <Button
              onClick={() => navigate('/game')}
              className="mt-6 bg-gradient-primary hover:opacity-90 text-primary-foreground"
            >
              Start a Game
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {liveGames.map((game, index) => (
              <Card
                key={game.id}
                className="p-6 border-primary/20 shadow-glow hover:border-primary/40 transition-all animate-slide-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent/10 rounded-lg">
                      <Zap className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Game Mode</p>
                      <p className="font-bold text-foreground capitalize">
                        {game.mode.replace('-', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-lg">{game.timeRemaining}s</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{game.player1}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          game.player1Alive
                            ? 'bg-accent/20 text-accent'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {game.player1Alive ? 'ALIVE' : 'DEAD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-game-snake1 rounded-sm shadow-glow" />
                      <p className="text-3xl font-bold text-game-snake1">{game.player1Score}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{game.player2}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          game.player2Alive
                            ? 'bg-accent/20 text-accent'
                            : 'bg-destructive/20 text-destructive'
                        }`}
                      >
                        {game.player2Alive ? 'ALIVE' : 'DEAD'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-game-snake2 rounded-sm" />
                      <p className="text-3xl font-bold text-game-snake2">{game.player2Score}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Spectators can join in future updates</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary/30 hover:border-primary/50"
                      disabled
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Watch (Coming Soon)
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
