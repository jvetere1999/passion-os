"use client";

/**
 * Market Client Component (D1-backed)
 * Spend coins on personal rewards - now backed by server-side storage
 */

import { useState, useEffect, useCallback } from "react";
import { LoadingState } from "@/components/ui";
import styles from "./page.module.css";

interface MarketItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  icon: string | null;
  is_global: number;
}

interface Purchase {
  id: string;
  item_id: string;
  item_name: string;
  item_cost: number;
  purchased_at: string;
  is_redeemed: number;
  redeemed_at: string | null;
}

interface WalletData {
  coins: number;
  xp: number;
  level: number;
}

interface MarketData {
  wallet: WalletData;
  items: MarketItem[];
  purchases: Purchase[];
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "Food & Drinks",
  entertainment: "Entertainment",
  selfcare: "Self Care",
  custom: "Custom Rewards",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  takeout: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 8V5a4 4 0 0 0-4-4 4 4 0 0 0-4 4v3" />
      <rect x="2" y="8" width="20" height="14" rx="2" />
    </svg>
  ),
  coffee: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" y1="2" x2="6" y2="4" />
      <line x1="10" y1="2" x2="10" y2="4" />
      <line x1="14" y1="2" x2="14" y2="4" />
    </svg>
  ),
  snack: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 13.87A4 4 0 0 1 7.41 6.6a5.11 5.11 0 0 1 1.05-1.11 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.6 6.6a4 4 0 0 1 1.4 7.27V17a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2Z" />
    </svg>
  ),
  movie: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  ),
  game: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      <circle cx="15" cy="13" r="1" />
      <circle cx="18" cy="11" r="1" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  ),
  sleep: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  spa: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22c-4.97 0-9-2.686-9-6v-1c0-2.762 4.03-5 9-5s9 2.238 9 5v1c0 3.314-4.03 6-9 6z" />
      <path d="M12 3c0 3-3 5-3 9" />
      <path d="M12 3c0 3 3 5 3 9" />
    </svg>
  ),
  nap: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 12h8" />
      <path d="M4 18V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12" />
      <path d="M16 12h4" />
      <path d="M18 9v6" />
    </svg>
  ),
  default: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
};

export function MarketClient() {
  const [wallet, setWallet] = useState<WalletData>({ coins: 0, xp: 0, level: 1 });
  const [items, setItems] = useState<MarketItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPurchased, setShowPurchased] = useState(false);

  // Purchase confirmation state
  const [confirmingItem, setConfirmingItem] = useState<MarketItem | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Load data from API
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/market");
      if (!response.ok) {
        throw new Error("Failed to load market data");
      }

      const data: MarketData = await response.json();
      setWallet(data.wallet);
      setItems(data.items);
      setPurchases(data.purchases);
    } catch (e) {
      console.error("Failed to load market data:", e);
      setError("Failed to load market. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Purchase a reward
  const handlePurchaseClick = useCallback((item: MarketItem) => {
    if (wallet.coins < item.cost) return;
    setConfirmingItem(item);
  }, [wallet.coins]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!confirmingItem || wallet.coins < confirmingItem.cost) {
      setConfirmingItem(null);
      return;
    }

    setIsPurchasing(true);
    try {
      const response = await fetch("/api/market/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: confirmingItem.id }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error || "Failed to purchase");
      }

      // Reload data to get updated wallet and purchases
      await loadData();
      setConfirmingItem(null);
    } catch (e) {
      console.error("Failed to purchase:", e);
      setError(e instanceof Error ? e.message : "Failed to purchase");
    } finally {
      setIsPurchasing(false);
    }
  }, [confirmingItem, wallet.coins, loadData]);

  const handleCancelPurchase = useCallback(() => {
    setConfirmingItem(null);
  }, []);

  // Redeem a purchase
  const handleRedeem = useCallback(async (purchaseId: string) => {
    try {
      const response = await fetch("/api/market/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchaseId }),
      });

      if (!response.ok) {
        throw new Error("Failed to redeem");
      }

      await loadData();
    } catch (e) {
      console.error("Failed to redeem:", e);
    }
  }, [loadData]);

  const categories = ["all", ...new Set(items.map(i => i.category))];
  const filteredItems = activeCategory === "all"
    ? items
    : items.filter((i) => i.category === activeCategory);

  const unredeemedPurchases = purchases.filter(p => !p.is_redeemed);

  if (isLoading) {
    return (
      <div className={styles.page}>
        <LoadingState message="Loading market..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div>
            <h1 className={styles.title}>Market</h1>
            <p className={styles.subtitle}>Spend your hard-earned coins</p>
          </div>
          <div className={styles.walletDisplay}>
            <div className={styles.walletCoins}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>{wallet.coins}</span>
            </div>
            <div className={styles.walletLevel}>
              Level {wallet.level}
            </div>
          </div>
        </div>

        <div className={styles.categoryTabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.categoryTab} ${activeCategory === cat ? styles.active : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>
      </header>

      {/* Unredeemed purchases banner */}
      {unredeemedPurchases.length > 0 && (
        <div className={styles.unredeemedBanner}>
          <span>You have {unredeemedPurchases.length} reward{unredeemedPurchases.length > 1 ? "s" : ""} to redeem!</span>
          <button onClick={() => setShowPurchased(true)}>View</button>
        </div>
      )}

      {/* Items grid */}
      <div className={styles.grid}>
        {filteredItems.map((item) => (
          <div key={item.id} className={styles.card}>
            <div className={styles.cardIcon}>
              {item.icon && CATEGORY_ICONS[item.icon]
                ? CATEGORY_ICONS[item.icon]
                : CATEGORY_ICONS.default}
            </div>
            <div className={styles.cardContent}>
              <h3 className={styles.cardName}>{item.name}</h3>
              <p className={styles.cardDescription}>{item.description}</p>
            </div>
            <div className={styles.cardFooter}>
              <span className={styles.cardCost}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                {item.cost}
              </span>
              <button
                className={styles.purchaseButton}
                onClick={() => handlePurchaseClick(item)}
                disabled={wallet.coins < item.cost}
              >
                {wallet.coins < item.cost ? "Not enough" : "Purchase"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Purchases history toggle */}
      <div className={styles.purchasesSection}>
        <button
          className={styles.togglePurchases}
          onClick={() => setShowPurchased(!showPurchased)}
        >
          {showPurchased ? "Hide" : "Show"} Purchase History ({purchases.length})
        </button>

        {showPurchased && (
          <div className={styles.purchasesList}>
            {purchases.length === 0 ? (
              <p className={styles.emptyPurchases}>No purchases yet</p>
            ) : (
              purchases.map((purchase) => (
                <div key={purchase.id} className={styles.purchaseItem}>
                  <div className={styles.purchaseInfo}>
                    <span className={styles.purchaseName}>{purchase.item_name}</span>
                    <span className={styles.purchaseDate}>
                      {new Date(purchase.purchased_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.purchaseActions}>
                    <span className={styles.purchaseCost}>
                      {purchase.item_cost} coins
                    </span>
                    {!purchase.is_redeemed && (
                      <button
                        className={styles.redeemButton}
                        onClick={() => handleRedeem(purchase.id)}
                      >
                        Redeem
                      </button>
                    )}
                    {purchase.is_redeemed && (
                      <span className={styles.redeemedBadge}>Redeemed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Purchase confirmation modal */}
      {confirmingItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Confirm Purchase</h3>
            <p className={styles.modalText}>
              Purchase <strong>{confirmingItem.name}</strong> for{" "}
              <strong>{confirmingItem.cost} coins</strong>?
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={handleCancelPurchase}
                disabled={isPurchasing}
              >
                Cancel
              </button>
              <button
                className={styles.confirmButton}
                onClick={handleConfirmPurchase}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

