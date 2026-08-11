export type WalletTransactionType =
  | "PURCHASE"
  | "TRANSFER"
  | "REWARD"
  | "REDEEM"
  | "WITHDRAWAL"
  | "INCOMING"
  | "CHALLENGE_RESERVE"
  | "CHALLENGE_RELEASE";
export type WalletTransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface WalletBalance {
  id: string;
  tokenId: string;
  type: string;
  amount: string;
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

export interface Wallet {
  userId: string;
  address: string;
  balances: WalletBalance[];
  reservedBalances?: Record<string, { amount: number | string; expiresAt: string }>;
}

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: string;
  status: WalletTransactionStatus;
  fromAddress?: string;
  toAddress?: string;
  hash?: string;
  timestamp: string;
  createdAt?: string;
  token?: Pick<WalletBalance, "tokenId" | "name" | "symbol" | "decimals">;
  metadata?: {
    commission?: number;
    currency?: string;
    description?: string;
    glkAmount?: number;
    teamId?: string;
    challengeId?: string;
    transferAmount?: number;
  };
}

export interface WalletInsights {
  metrics: {
    totalPurchased: number;
    totalTransferred: number;
    totalReserved: number;
    totalWithdrawn: number;
    totalFees: number;
  };
  trendData: Array<{
    month: string;
    purchased: number;
    transferred: number;
    reserved: number;
    fees: number;
  }>;
}

export interface WalletTransactionPage {
  data: WalletTransaction[];
  total: number;
  totalPages: number;
  page: number;
}

export interface WalletTransactionFilters {
  type?: WalletTransactionType;
  status?: WalletTransactionStatus;
}

export interface TransferReceipt extends WalletTransaction {
  metadata: NonNullable<WalletTransaction["metadata"]> & {
    commission?: number;
    transferAmount?: number;
    recipientUserId?: string;
    teamId?: string;
  };
}

export interface PaymentMethod {
  id: string;
  brand: string;
  lastFour: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}
