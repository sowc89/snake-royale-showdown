import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { authApi } from '@/services/api';
import { toast } from '@/hooks/use-toast';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { user } = await authApi.login(email, password);
        toast({
          title: 'Welcome back!',
          description: `Logged in as ${user.username}`,
        });
      } else {
        const { user } = await authApi.signup(email, password, username);
        toast({
          title: 'Account created!',
          description: `Welcome, ${user.username}!`,
        });
      }
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-card">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            SNAKE ARENA
          </h1>
          <p className="text-muted-foreground text-lg">Multiplayer Snake Battle</p>
        </div>

        <Card className="p-8 border-primary/20 shadow-glow">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="player@snake.game"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-muted border-border focus:border-primary"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="SnakeMaster"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-muted border-border focus:border-primary"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-muted border-border focus:border-primary"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold text-lg h-12"
              disabled={loading}
            >
              {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:text-primary/80 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">Demo credentials:</p>
            <div className="text-xs text-muted-foreground space-y-1 text-center">
              <p>Email: demo@game.com</p>
              <p>Password: demo123</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
