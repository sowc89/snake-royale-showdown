import { describe, it, expect, beforeEach } from 'vitest';
import { authApi, gameApi } from '@/services/api';

describe('Auth API', () => {
  beforeEach(async () => {
    await authApi.logout();
  });

  it('should login with valid credentials', async () => {
    const result = await authApi.login('demo@game.com', 'demo123');
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('DemoPlayer');
    expect(result.token).toBe('mock-jwt-token');
  });

  it('should throw error with invalid credentials', async () => {
    await expect(authApi.login('wrong@email.com', 'wrong')).rejects.toThrow('Invalid credentials');
  });

  it('should signup new user', async () => {
    const result = await authApi.signup('new@user.com', 'password123', 'NewPlayer');
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('NewPlayer');
    expect(result.user.email).toBe('new@user.com');
  });

  it('should throw error when signing up with existing email', async () => {
    await expect(authApi.signup('demo@game.com', 'pass', 'Test')).rejects.toThrow('Email already exists');
  });

  it('should logout user', async () => {
    await authApi.login('demo@game.com', 'demo123');
    expect(authApi.getCurrentUser()).toBeTruthy();
    
    await authApi.logout();
    expect(authApi.getCurrentUser()).toBeNull();
  });
});

describe('Game API', () => {
  it('should return game modes', async () => {
    const modes = await gameApi.getGameModes();
    expect(modes).toHaveLength(2);
    expect(modes[0].id).toBe('pass-through');
    expect(modes[1].id).toBe('walls');
  });

  it('should save game result', async () => {
    const result = await gameApi.saveGameResult({
      player1: 'Player1',
      player2: 'Player2',
      winner: 'Player1',
      player1Score: 15,
      player2Score: 10,
      mode: 'walls',
      duration: 45,
    });

    expect(result).toBeDefined();
    expect(result.id).toBeDefined();
    expect(result.timestamp).toBeDefined();
    expect(result.player1).toBe('Player1');
  });

  it('should return leaderboard', async () => {
    const leaderboard = await gameApi.getLeaderboard();
    expect(leaderboard).toBeDefined();
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(leaderboard[0].rank).toBe(1);
    
    // Verify sorting by wins
    for (let i = 0; i < leaderboard.length - 1; i++) {
      expect(leaderboard[i].wins).toBeGreaterThanOrEqual(leaderboard[i + 1].wins);
    }
  });

  it('should return live games', async () => {
    const liveGames = await gameApi.getLiveGames();
    expect(liveGames).toBeDefined();
    expect(Array.isArray(liveGames)).toBe(true);
    
    if (liveGames.length > 0) {
      const game = liveGames[0];
      expect(game.player1).toBeDefined();
      expect(game.player2).toBeDefined();
      expect(game.mode).toMatch(/pass-through|walls/);
    }
  });
});
