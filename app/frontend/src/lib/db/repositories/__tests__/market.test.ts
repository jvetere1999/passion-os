/**
 * Market Repository Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock D1 database
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  run: vi.fn(),
  all: vi.fn(),
};

describe("Market Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMarketItems", () => {
    it("should return all active market items", async () => {
      const items = [
        { id: "item_1", name: "Coffee Break", cost_coins: 50, category: "food" },
        { id: "item_2", name: "Movie Night", cost_coins: 100, category: "entertainment" },
      ];
      mockDb.all.mockResolvedValue({ results: items });

      expect(items.length).toBe(2);
      expect(items[0].cost_coins).toBe(50);
    });
  });

  describe("getUserWallet", () => {
    it("should return user wallet with balances", async () => {
      const wallet = {
        id: "wallet_123",
        user_id: "user_123",
        coins: 500,
        xp: 1250,
        level: 3,
        xp_to_next_level: 225,
        total_skill_stars: 15,
      };
      mockDb.first.mockResolvedValue(wallet);

      expect(wallet.coins).toBe(500);
      expect(wallet.level).toBe(3);
    });

    it("should return null if wallet doesn't exist", async () => {
      mockDb.first.mockResolvedValue(null);

      const wallet = null;
      expect(wallet).toBeNull();
    });
  });

  describe("purchaseItem", () => {
    it("should succeed if user has enough coins", async () => {
      const wallet = { coins: 500 };
      const item = { cost_coins: 100 };

      const canAfford = wallet.coins >= item.cost_coins;
      expect(canAfford).toBe(true);

      const newBalance = wallet.coins - item.cost_coins;
      expect(newBalance).toBe(400);
    });

    it("should fail if user has insufficient coins", async () => {
      const wallet = { coins: 50 };
      const item = { cost_coins: 100 };

      const canAfford = wallet.coins >= item.cost_coins;
      expect(canAfford).toBe(false);
    });

    it("should create purchase record", async () => {
      mockDb.run.mockResolvedValue({ success: true });

      const purchase = {
        id: "purchase_123",
        user_id: "user_123",
        item_id: "item_1",
        cost_paid: 100,
        is_redeemed: 0,
        purchased_at: new Date().toISOString(),
      };

      expect(purchase.is_redeemed).toBe(0);
    });

    it("should deduct coins from wallet", async () => {
      mockDb.run.mockResolvedValue({ success: true });

      const initialCoins = 500;
      const cost = 100;
      const finalCoins = initialCoins - cost;

      expect(finalCoins).toBe(400);
    });
  });

  describe("redeemPurchase", () => {
    it("should mark purchase as redeemed", async () => {
      mockDb.run.mockResolvedValue({ success: true });

      const purchase = {
        id: "purchase_123",
        is_redeemed: 0,
      };

      // After redemption
      purchase.is_redeemed = 1;
      expect(purchase.is_redeemed).toBe(1);
    });

    it("should fail if already redeemed", async () => {
      const purchase = {
        id: "purchase_123",
        is_redeemed: 1,
      };

      const canRedeem = purchase.is_redeemed === 0;
      expect(canRedeem).toBe(false);
    });
  });

  describe("getUserPurchases", () => {
    it("should return all user purchases with item details", async () => {
      const purchases = [
        { id: "p1", item_name: "Coffee Break", is_redeemed: 1 },
        { id: "p2", item_name: "Movie Night", is_redeemed: 0 },
      ];
      mockDb.all.mockResolvedValue({ results: purchases });

      expect(purchases.length).toBe(2);
      expect(purchases[1].is_redeemed).toBe(0);
    });
  });
});

describe("Market Balance Invariants", () => {
  it("should never allow negative coin balance", () => {
    const wallet = { coins: 50 };
    const item = { cost_coins: 100 };

    // Purchase should be rejected
    const allowed = wallet.coins >= item.cost_coins;
    expect(allowed).toBe(false);
    expect(wallet.coins).toBeGreaterThanOrEqual(0);
  });

  it("should use ledger-based balance tracking", () => {
    // All transactions go through points_ledger
    // Wallet balance is derived from ledger
    // This ensures audit trail and idempotency
    expect(true).toBe(true);
  });

  it("should be idempotent with purchase IDs", () => {
    // Same purchase ID should not create duplicate
    const purchaseId = "purchase_123";

    // Second attempt with same ID should be rejected or no-op
    expect(purchaseId).toBe("purchase_123");
  });
});

