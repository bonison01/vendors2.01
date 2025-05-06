export interface DeliveryRecord {
  id: number;
  date: string | null;
  name: string | null;
  address: string | null;
  mobile: string | null;
  vendor: string | null;
  team: string | null;
  mode: string | null;
  pb: string | null;
  dc: string | null;
  pb_amt: number | null;
  dc_amt: number | null;
  tsb: number | null;
  cid: number | null;
  status: string | null;
  note: string | null;
  order_id: string;
  vendor_id: number | null;
  delivery_id: number | null;
}

export interface EnhancedDeliveryRecord extends DeliveryRecord {
  calculatedTsb: number;
  calculatedCid: number;
  productBill: string | number;
  deliveryAmt: string;
  description: string;
  runningBalance: number;
}