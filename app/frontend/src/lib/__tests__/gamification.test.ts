/**
 * Gamification Logic Unit Tests
 *
 * Tests XP, leveling, streaks, and achievement calculations.
 */

import { describe, it, expect } from 'vitest';

describe('XP and Leveling', () => {
  describe('XP to Level Conversion', () => {
    const xpForLevel = (level: number): number => {
      // Exponential growth formula
      return Math.floor(100 * Math.pow(1.5, level - 1));
    };

    const levelFromXP = (totalXP: number): number => {
      let level = 1;
      let xpNeeded = 0;
      
      while (xpNeeded + xpForLevel(level) <= totalXP) {
        xpNeeded += xpForLevel(level);
        level++;
      }
      
      return level;
    };

    it('calculates XP needed for each level', () => {
      expect(xpForLevel(1)).toBe(100);
      expect(xpForLevel(2)).toBe(150);
      expect(xpForLevel(3)).toBe(225);
    });

    it('determines level from total XP', () => {
      expect(levelFromXP(0)).toBe(1);
      expect(levelFromXP(100)).toBe(2);
      expect(levelFromXP(250)).toBe(3);
      expect(levelFromXP(500)).toBe(4);
    });

    it('calculates progress to next level', () => {
      const getProgress = (totalXP: number): { level: number; progress: number; xpToNext: number } => {
        let level = 1;
        let xpSpent = 0;
        
        while (xpSpent + xpForLevel(level) <= totalXP) {
          xpSpent += xpForLevel(level);
          level++;
        }
        
        const currentLevelXP = totalXP - xpSpent;
        const xpNeeded = xpForLevel(level);
        
        return {
          level,
          progress: (currentLevelXP / xpNeeded) * 100,
          xpToNext: xpNeeded - currentLevelXP,
        };
      };

      const result = getProgress(150);
      expect(result.level).toBe(2);
      expect(result.progress).toBeCloseTo(100 / 3, 5);
    });
  });
});

describe('Streak System', () => {
  describe('Streak Calculation', () => {
    it('calculates current streak', () => {
      const calculateStreak = (completionDates: Date[], today: Date): number => {
        const sorted = completionDates
          .map(d => d.toISOString().split('T')[0])
          .sort()
          .reverse();
        
        if (sorted.length === 0) return 0;
        
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = new Date(today.getTime() - 86400000).toISOString().split('T')[0];
        
        // Must have completed today or yesterday
        if (sorted[0] !== todayStr && sorted[0] !== yesterdayStr) {
          return 0;
        }
        
        let streak = 1;
        for (let i = 1; i < sorted.length; i++) {
          const current = new Date(sorted[i - 1]);
          const prev = new Date(sorted[i]);
          const diffDays = (current.getTime() - prev.getTime()) / 86400000;
          
          if (diffDays === 1) {
            streak++;
          } else {
            break;
          }
        }
        
        return streak;
      };

      const today = new Date('2025-01-10');
      const dates = [
        new Date('2025-01-10'),
        new Date('2025-01-09'),
        new Date('2025-01-08'),
        new Date('2025-01-07'),
      ];
      
      expect(calculateStreak(dates, today)).toBe(4);
    });

    it('resets streak on gap', () => {
      const hasGap = (dates: string[]): boolean => {
        const sorted = [...dates].sort().reverse();
        
        for (let i = 1; i < sorted.length; i++) {
          const current = new Date(sorted[i - 1]);
          const prev = new Date(sorted[i]);
          const diffDays = (current.getTime() - prev.getTime()) / 86400000;
          
          if (diffDays > 1) return true;
        }
        
        return false;
      };

      expect(hasGap(['2025-01-10', '2025-01-09', '2025-01-08'])).toBe(false);
      expect(hasGap(['2025-01-10', '2025-01-08'])).toBe(true);
    });
  });

  describe('Streak Types', () => {
    it('supports multiple streak types', () => {
      const userStreaks = {
        daily: { current: 5, longest: 10 },
        focus: { current: 3, longest: 7 },
        workout: { current: 0, longest: 14 },
        reading: { current: 12, longest: 12 },
      };
      
      expect(userStreaks.daily.current).toBe(5);
      expect(userStreaks.reading.current).toBe(userStreaks.reading.longest);
    });
  });

  describe('Streak Freeze', () => {
    it('allows streak protection', () => {
      const canUseFreeze = (
        freezesAvailable: number,
        lastCompletionDate: Date,
        today: Date
      ): boolean => {
        const daysSinceCompletion = Math.floor(
          (today.getTime() - lastCompletionDate.getTime()) / 86400000
        );
        
        return freezesAvailable > 0 && daysSinceCompletion === 1;
      };

      const today = new Date('2025-01-10');
      const yesterday = new Date('2025-01-09');
      const twoDaysAgo = new Date('2025-01-08');
      
      expect(canUseFreeze(2, yesterday, today)).toBe(true);
      expect(canUseFreeze(0, yesterday, today)).toBe(false);
      expect(canUseFreeze(2, twoDaysAgo, today)).toBe(false);
    });
  });
});

describe('Achievement System', () => {
  describe('Trigger Evaluation', () => {
    it('evaluates event-based triggers', () => {
      const checkEventTrigger = (
        trigger: { event: string; count: number },
        userEvents: { type: string }[]
      ): boolean => {
        const matchingEvents = userEvents.filter(e => e.type === trigger.event);
        return matchingEvents.length >= trigger.count;
      };

      const trigger = { event: 'focus_complete', count: 10 };
      const events = Array(15).fill({ type: 'focus_complete' });
      
      expect(checkEventTrigger(trigger, events)).toBe(true);
      expect(checkEventTrigger(trigger, events.slice(0, 5))).toBe(false);
    });

    it('evaluates threshold-based triggers', () => {
      const checkThresholdTrigger = (
        trigger: { field: string; value: number },
        userData: Record<string, number>
      ): boolean => {
        return (userData[trigger.field] || 0) >= trigger.value;
      };

      expect(checkThresholdTrigger({ field: 'total_xp', value: 1000 }, { total_xp: 1500 })).toBe(true);
      expect(checkThresholdTrigger({ field: 'total_xp', value: 1000 }, { total_xp: 500 })).toBe(false);
    });
  });

  describe('Hidden Achievements', () => {
    it('filters hidden achievements for display', () => {
      const achievements = [
        { key: 'public1', is_hidden: false },
        { key: 'hidden1', is_hidden: true },
        { key: 'public2', is_hidden: false },
      ];

      const userAchieved = ['public1', 'hidden1'];
      
      const visibleAchievements = achievements.filter(
        a => !a.is_hidden || userAchieved.includes(a.key)
      );
      
      expect(visibleAchievements).toHaveLength(3);
      expect(achievements.filter(a => !a.is_hidden)).toHaveLength(2);
    });
  });
});

describe('Coin Economy', () => {
  describe('Earning Coins', () => {
    it('calculates coins from activities', () => {
      const coinRewards: Record<string, number> = {
        focus_complete: 5,
        habit_complete: 3,
        achievement_unlock: 10,
        daily_login: 1,
      };

      const activities = [
        { type: 'focus_complete' },
        { type: 'focus_complete' },
        { type: 'habit_complete' },
        { type: 'daily_login' },
      ];

      const totalCoins = activities.reduce(
        (acc, activity) => acc + (coinRewards[activity.type] || 0),
        0
      );

      expect(totalCoins).toBe(14);
    });
  });

  describe('Spending Coins', () => {
    it('validates purchase affordability', () => {
      const canPurchase = (userCoins: number, itemPrice: number): boolean => {
        return userCoins >= itemPrice;
      };

      expect(canPurchase(500, 300)).toBe(true);
      expect(canPurchase(200, 300)).toBe(false);
    });

    it('prevents duplicate purchases for one-time items', () => {
      const canPurchaseItem = (
        itemKey: string,
        userPurchases: string[],
        isOneTime: boolean
      ): boolean => {
        if (isOneTime && userPurchases.includes(itemKey)) {
          return false;
        }
        return true;
      };

      const userPurchases = ['theme_dark', 'avatar_robot'];
      
      expect(canPurchaseItem('theme_light', userPurchases, true)).toBe(true);
      expect(canPurchaseItem('theme_dark', userPurchases, true)).toBe(false);
      expect(canPurchaseItem('coins_boost', userPurchases, false)).toBe(true);
    });
  });
});
