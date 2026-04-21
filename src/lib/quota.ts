import { TrackedFunction, QUOTA_MATRIX, PlanLevel } from "./quota-matrix";
import { getTodayUsage } from "./firebase/usage";
import "server-only";

export interface QuotaResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Checks if a function execution is allowed for the user/IP.
 */
export async function checkQuota(
  uid: string | null, 
  ipHash: string, 
  functionName: TrackedFunction, 
  plan: PlanLevel
): Promise<QuotaResult> {
  const usage = await getTodayUsage(uid, ipHash);
  const currentCount = usage.counts[functionName] || 0;
  
  // Safe fallback if plan not specified properly
  const effectivePlan = plan || (uid ? "free" : "anon");
  
  const limitList = QUOTA_MATRIX[effectivePlan];
  if (!limitList) {
    throw new Error(`Invalid plan level: ${effectivePlan}`);
  }
  
  const limit = limitList[functionName];
  const allowed = currentCount < limit;
  
  // Reset is at midnight UTC today
  const resetAt = new Date();
  resetAt.setUTCHours(24, 0, 0, 0);

  return {
    allowed,
    remaining: Math.max(0, limit - currentCount),
    resetAt,
  };
}
