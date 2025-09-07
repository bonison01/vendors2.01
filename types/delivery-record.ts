// types/delivery-record.ts

export interface EnhancedDeliveryRecord {
  order_id: string;
  vendor_id: string;

  // Core details
  date: string | null;
  name: string | null;
  address: string | null;
  mobile: string | null;
  note: string | null;
  status: string | null;

  // Delivery/payment fields
  mode: string | null;      // ⚡ added
  pb: string | null;        // product bill type
  dc: string | null;        // delivery charge type
  pb_amt: number | null;    // product bill amount
  dc_amt: number | null;    // delivery charge amount
  tsb: number | null;       // ⚡ already in DB

  // Customer/vendor identifiers
  cid: string | null;

  // Derived fields
  calculatedTsb: number;    // same as tsb (for UI compatibility)
  runningBalance: number;   // cumulative balance

  // Optional extras (if your UI uses them)
  description?: string | null;
  productBill?: number | null;
  deliveryAmt?: number | null;
}
