// lib/balanceCalculation.ts
import { EnhancedDeliveryRecord } from "@/types/delivery-record";

/**
 * Compute running balance.
 * - Sorts by date ascending (oldest first).
 * - Uses tsb from DB (coerced to Number).
 * - Skips balance calculation for records with status containing "return" (case-insensitive).
 * - Returns enhanced records in ascending order (oldest -> newest) with:
 *   { calculatedTsb: number, runningBalance: number }
 */
export function balanceCalculation(records: EnhancedDeliveryRecord[]) {
  if (!Array.isArray(records) || records.length === 0) return [];

  // defensive copy + sort by date (oldest first)
  const sorted = [...records].sort((a, b) => {
    const ta = a?.date ? new Date(a.date).getTime() : 0;
    const tb = b?.date ? new Date(b.date).getTime() : 0;
    return ta - tb;
  });

  let runningBalance = 0;

  return sorted.map((rec) => {
    const tsb = Number(rec.tsb ?? 0);

    // Case-insensitive check for the word "return" anywhere in the status
    const isReturn = typeof rec.status === "string" && /Returned/i.test(rec.status);

    // Only update runningBalance if status doesn't include "return"
    if (!isReturn) {
      runningBalance += tsb;
    }

    return {
      ...rec,
      calculatedTsb: tsb,
      runningBalance,
    } as EnhancedDeliveryRecord & { calculatedTsb: number; runningBalance: number };
  });
}
