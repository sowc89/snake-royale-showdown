import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authApi } from '@/services/api';
import { User, Gamepad2, Trophy, Eye, LogOut } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(authApi.getCurrentUser());

  useEffect(() => {
    const currentUser = authApi.getCurrentUser();
    if (!currentUser) {
      navigate('/auth');
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  const handleLogout = async () => {
    await authApi.logout();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      <div className="max-w-6xl mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SNAKE ARENA
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <User className="w-4 h-4 text-primary" />
              <p className="text-foreground font-medium">{user.username}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Main Menu Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card
            className="p-8 border-primary/30 shadow-glow hover:border-primary/50 transition-all cursor-pointer group animate-slide-in"
            onClick={() => navigate('/game')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                <Gamepad2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Start Game</h2>
                <p className="text-muted-foreground">Begin a new multiplayer match</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Choose your mode and battle against another player in real-time snake combat!
            </p>
          </Card>

          <Card
            className="p-8 border-secondary/30 shadow-glow hover:border-secondary/50 transition-all cursor-pointer group animate-slide-in"
            style={{ animationDelay: '100ms' }}
            onClick={() => navigate('/leaderboard')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                <Trophy className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Leaderboard</h2>
                <p className="text-muted-foreground">View top players and rankings</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Check out the best players, win rates, and highest scores in the arena.
            </p>
          </Card>

          <Card
            className="p-8 border-accent/30 shadow-glow-accent hover:border-accent/50 transition-all cursor-pointer group animate-slide-in"
            style={{ animationDelay: '200ms' }}
            onClick={() => navigate('/live-games')}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                <Eye className="w-8 h-8 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Live Games</h2>
                <p className="text-muted-foreground">Watch matches in progress</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Spectate live games and learn strategies from other players.
            </p>
          </Card>

          <Card className="p-8 border-border/30 animate-slide-in" style={{ animationDelay: '300ms' }}>
            <h3 className="text-xl font-bold text-foreground mb-4">Game Modes</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <div>
                  <p className="font-medium text-foreground">Pass-Through</p>
                  <p className="text-sm text-muted-foreground">
                    Snakes wrap around screen edges
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-secondary rounded-full mt-2" />
                <div>
                  <p className="font-medium text-foreground">Walls</p>
                  <p className="text-sm text-muted-foreground">
                    Traditional mode with deadly walls
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Stats */}
        <Card className="p-6 border-border/30 animate-fade-in">
          <h3 className="text-lg font-bold text-foreground mb-4">How to Play</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">Player 1 Controls</p>
              <p>Arrow Keys: ↑ ↓ ← →</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Player 2 Controls</p>
              <p>WASD Keys: W A S D</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Objective</p>
              <p>Eat food, avoid collisions, survive 60 seconds</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
