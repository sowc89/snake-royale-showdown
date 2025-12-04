import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { gameApi, LeaderboardEntry } from '@/services/api';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await gameApi.getLeaderboard();
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-[#FFD700]" />;
      case 2:
        return <Medal className="w-6 h-6 text-[#C0C0C0]" />;
      case 3:
        return <Medal className="w-6 h-6 text-[#CD7F32]" />;
      default:
        return <span className="text-muted-foreground font-bold">{rank}</span>;
    }
  };

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
            Leaderboard
          </h1>
          <div className="w-32" /> {/* Spacer */}
        </div>

        {/* Leaderboard */}
        <Card className="p-6 border-primary/20 shadow-glow animate-slide-in">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No games played yet!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-[60px_1fr_100px_100px_120px] gap-4 pb-3 border-b border-border text-sm font-medium text-muted-foreground">
                <div>Rank</div>
                <div>Player</div>
                <div className="text-center">Wins</div>
                <div className="text-center">Games</div>
                <div className="text-right">Win Rate</div>
              </div>

              {/* Leaderboard Entries */}
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.username}
                  className="grid grid-cols-[60px_1fr_100px_100px_120px] gap-4 items-center p-4 rounded-lg bg-card/50 hover:bg-card transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{entry.username}</p>
                    <p className="text-xs text-muted-foreground">
                      High Score: <span className="text-primary font-medium">{entry.highestScore}</span>
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-accent">{entry.wins}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg text-foreground">{entry.totalGames}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary rounded-full transition-all"
                          style={{ width: `${entry.winRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground w-12">
                        {entry.winRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Stats Summary */}
        {leaderboard.length > 0 && (
          <div className="grid md:grid-cols-3 gap-4 animate-fade-in">
            <Card className="p-6 border-border/30">
              <p className="text-sm text-muted-foreground mb-1">Top Player</p>
              <p className="text-2xl font-bold text-primary">{leaderboard[0].username}</p>
            </Card>
            <Card className="p-6 border-border/30">
              <p className="text-sm text-muted-foreground mb-1">Highest Win Rate</p>
              <p className="text-2xl font-bold text-accent">
                {Math.max(...leaderboard.map(e => e.winRate)).toFixed(0)}%
              </p>
            </Card>
            <Card className="p-6 border-border/30">
              <p className="text-sm text-muted-foreground mb-1">Highest Score</p>
              <p className="text-2xl font-bold text-secondary">
                {Math.max(...leaderboard.map(e => e.highestScore))}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
