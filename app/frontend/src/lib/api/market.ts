/**
 * Market API
 *
 * API client methods for the reward market (purchasing and redeeming items).
 * All calls go through the backend at api.ecent.online.
 *
 * PARITY-036: Market routes
 * REFACTOR: Uses shared client (January 2026)
 */

import { apiGet, apiPost } from './client';

// ============================================
// Types
// ============================================

export type PurchaseStatus = 'active' | 'redeemed' | 'expired' | 'refunded';

export interface MarketItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  price_coins: number;
  icon: string | null;
  available: boolean;
  limit_per_user: number | null;
  requires_level: number | null;
  effect_json: unknown | null;
  created_at: string;
}

export interface UserPurchase {
  id: string;
  item_id: string;
  item_key: string;
  item_name: string;
  price_paid: number;
  status: PurchaseStatus;
  purchased_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
}

export interface Wallet {
  coins: number;
  lifetime_coins: number;
}

export interface MarketOverview {
  items: MarketItem[];
  wallet: Wallet;
  recent_purchases: UserPurchase[];
}

// Request types
export interface PurchaseRequest {
  item_key: string;
  quantity?: number;
}

export interface RedeemRequest {
  purchase_id: string;
}

// Response wrappers
interface DataWrapper<T> {
  data: T;
}

interface ItemsResponse {
  items: MarketItem[];
  total: number;
}

interface HistoryResponse {
  purchases: UserPurchase[];
  total: number;
}

interface PurchaseResult {
  purchase_id: string;
  item_key: string;
  price_paid: number;
  new_balance: number;
}

interface RedeemResult {
  purchase_id: string;
  item_key: string;
  redeemed_at: string;
  effect: unknown | null;
}

// ============================================
// Market API
// ============================================

/** Get market overview (items + wallet + recent purchases) */
export async function getMarketOverview(): Promise<MarketOverview> {
  const response = await apiGet<DataWrapper<MarketOverview>>('/api/market');
  return response.data;
}

/** List all market items */
export async function listMarketItems(category?: string): Promise<MarketItem[]> {
  const path = category ? `/api/market/items?category=${category}` : '/api/market/items';
  const response = await apiGet<DataWrapper<ItemsResponse>>(path);
  return response.data.items;
}

/** Get a specific market item */
export async function getMarketItem(key: string): Promise<MarketItem> {
  const response = await apiGet<DataWrapper<MarketItem>>(`/api/market/items/${key}`);
  return response.data;
}

/** Purchase an item */
export async function purchaseItem(data: PurchaseRequest): Promise<PurchaseResult> {
  const response = await apiPost<DataWrapper<PurchaseResult>>('/api/market/purchase', data);
  return response.data;
}

/** Redeem a purchase */
export async function redeemPurchase(data: RedeemRequest): Promise<RedeemResult> {
  const response = await apiPost<DataWrapper<RedeemResult>>('/api/market/redeem', data);
  return response.data;
}

/** Get purchase history */
export async function getPurchaseHistory(status?: PurchaseStatus): Promise<UserPurchase[]> {
  const path = status ? `/api/market/history?status=${status}` : '/api/market/history';
  const response = await apiGet<DataWrapper<HistoryResponse>>(path);
  return response.data.purchases;
}

/** Get wallet balance */
export async function getWallet(): Promise<Wallet> {
  const response = await apiGet<DataWrapper<Wallet>>('/api/market/wallet');
  return response.data;
}
