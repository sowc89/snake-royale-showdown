import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/services/api';
import { gameRoomApi } from '@/services/gameRooms';
import { GameRoom } from '@/types/game';
import { ArrowLeft, Copy, Users, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function GameLobby() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomCode = searchParams.get('room');
  
  const [user] = useState(authApi.getCurrentUser());
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (roomCode) {
      const existingRoom = gameRoomApi.getRoom(roomCode);
      if (existingRoom) {
        setRoom(existingRoom);
      } else {
        toast({
          title: 'Room not found',
          description: 'This game room does not exist',
          variant: 'destructive',
        });
        navigate('/dashboard');
      }
    }
  }, [user, roomCode, navigate]);

  const handleCopyRoomCode = () => {
    if (room) {
      navigator.clipboard.writeText(room.id);
      toast({
        title: 'Copied!',
        description: 'Room code copied to clipboard',
      });
    }
  };

  const handleJoinRoom = async () => {
    if (!user || !joinCode.trim()) return;
    
    setLoading(true);
    try {
      const joinedRoom = gameRoomApi.joinRoom(joinCode.trim(), user.username);
      setRoom(joinedRoom);
      toast({
        title: 'Joined room!',
        description: `Waiting for ${joinedRoom.hostUsername} to start the game`,
      });
      // Update URL with room code
      navigate(`/lobby?room=${joinedRoom.id}`);
    } catch (error) {
      toast({
        title: 'Failed to join',
        description: error instanceof Error ? error.message : 'Could not join room',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = () => {
    if (!room) return;
    
    if (room.players.length < 2) {
      toast({
        title: 'Need more players',
        description: 'Waiting for another player to join',
        variant: 'destructive',
      });
      return;
    }

    gameRoomApi.startGame(room.id);
    navigate(`/game?room=${room.id}&mode=${room.mode}`);
  };

  const handleLeaveRoom = () => {
    if (room && user) {
      gameRoomApi.leaveRoom(room.id, user.username);
      navigate('/dashboard');
    }
  };

  if (!user) return null;

  // Show join room interface if no room selected
  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
        <div className="max-w-2xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-primary/30 hover:border-primary/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Join Game
            </h1>
            <div className="w-24" />
          </div>

          <Card className="p-8 border-primary/20 shadow-glow">
            <div className="space-y-6">
              <div>
                <Label htmlFor="roomCode" className="text-foreground text-lg mb-2 block">
                  Enter Room Code
                </Label>
                <Input
                  id="roomCode"
                  type="text"
                  placeholder="ABC123"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="bg-muted border-border focus:border-primary text-lg text-center tracking-wider"
                  maxLength={6}
                />
              </div>

              <Button
                onClick={handleJoinRoom}
                disabled={loading || !joinCode.trim()}
                className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-lg h-12"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Show lobby with room details
  const isHost = room.hostUsername === user.username;
  const waitingForPlayers = room.players.length < room.maxPlayers;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card p-4">
      <div className="max-w-3xl mx-auto space-y-6 py-8">
        <div className="flex items-center justify-between animate-fade-in">
          <Button
            variant="outline"
            onClick={handleLeaveRoom}
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Leave Room
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <div className="w-24" />
        </div>

        {/* Room Code Card */}
        <Card className="p-8 border-primary/30 shadow-glow text-center animate-slide-in">
          <p className="text-muted-foreground mb-2">Room Code</p>
          <div className="flex items-center justify-center gap-4">
            <p className="text-5xl font-bold text-primary tracking-wider">{room.id}</p>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyRoomCode}
              className="border-primary/30 hover:border-primary/50"
            >
              <Copy className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Share this code with your friend to join the game
          </p>
        </Card>

        {/* Game Info */}
        <Card className="p-6 border-border/30 animate-slide-in" style={{ animationDelay: '100ms' }}>
          <h3 className="text-xl font-bold text-foreground mb-4">Game Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mode</p>
                <p className="font-medium text-foreground capitalize">{room.mode.replace('-', ' ')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="font-medium text-foreground">60 seconds</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Players List */}
        <Card className="p-6 border-border/30 animate-slide-in" style={{ animationDelay: '200ms' }}>
          <h3 className="text-xl font-bold text-foreground mb-4">
            Players ({room.players.length}/{room.maxPlayers})
          </h3>
          <div className="space-y-3">
            {room.players.map((player, index) => (
              <div
                key={player}
                className="flex items-center justify-between p-4 bg-card/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    index === 0 ? 'bg-game-snake1/20' : 'bg-game-snake2/20'
                  }`}>
                    <span className={`text-lg font-bold ${
                      index === 0 ? 'text-game-snake1' : 'text-game-snake2'
                    }`}>
                      {player.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{player}</p>
                    {player === room.hostUsername && (
                      <p className="text-xs text-primary">Host</p>
                    )}
                  </div>
                </div>
                {player === user.username && (
                  <span className="px-3 py-1 bg-primary/20 text-primary rounded text-sm">
                    You
                  </span>
                )}
              </div>
            ))}
            
            {/* Empty slot */}
            {waitingForPlayers && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <Users className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Waiting for player...</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Start Game Button */}
        {isHost && (
          <Button
            onClick={handleStartGame}
            disabled={waitingForPlayers}
            className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-lg h-14 animate-fade-in"
          >
            {waitingForPlayers ? 'Waiting for Players...' : 'Start Game'}
          </Button>
        )}

        {!isHost && (
          <Card className="p-4 border-accent/30 bg-accent/5 text-center">
            <p className="text-accent font-medium">
              Waiting for {room.hostUsername} to start the game...
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
