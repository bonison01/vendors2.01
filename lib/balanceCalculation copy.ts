import { DeliveryRecord, EnhancedDeliveryRecord } from '@/types/delivery-record';

// Helper to round floats to 2 decimal places
const round = (value: number): number => parseFloat(value.toFixed(2));

export const balanceCalculation = (records: DeliveryRecord[]): EnhancedDeliveryRecord[] => {
  const tsbCidLookup: Record<string, (pbAmt: number, dcAmt: number) => { tsb: number; cid: number }> = {
    'COD_COD': (pbAmt, dcAmt) => ({ tsb: pbAmt, cid: pbAmt + dcAmt }),
    'COD_Prepaid': (pbAmt, dcAmt) => ({ tsb: pbAmt, cid: pbAmt }),
    'COD_Due': (pbAmt, dcAmt) => ({ tsb: pbAmt - dcAmt, cid: pbAmt }),
    'Prepaid_COD': (pbAmt, dcAmt) => ({ tsb: 0, cid: dcAmt }),
    'Prepaid_Prepaid': (pbAmt, dcAmt) => ({ tsb: 0, cid: 0 }),
    'Prepaid_Due': (pbAmt, dcAmt) => ({ tsb: -dcAmt, cid: 0 }),
    'Due_COD': (pbAmt, dcAmt) => ({ tsb: -pbAmt, cid: dcAmt }),
    'Due_Prepaid': (pbAmt, dcAmt) => ({ tsb: -pbAmt, cid: 0 }),
    'Due_Due': (pbAmt, dcAmt) => ({ tsb: -pbAmt - dcAmt, cid: 0 }),
  };

  const calculateTSBandCID = (record: DeliveryRecord) => {
    const pb = record.pb || '';
    const dc = record.dc || '';
    const pbAmt = record.pb_amt || 0;
    const dcAmt = record.dc_amt || 0;
    const statusLower = (record.status || '').toLowerCase();

    // Special case for GPay / Cash
    if (
      (statusLower.includes('gpay') || statusLower.includes('cash')) &&
      !record.pb &&
      !record.dc
    ) {
      const tsbValue = record.tsb !== null ? record.tsb : dcAmt || 0;
      return { tsb: tsbValue, cid: 0 };
    }

    const key = `${pb}_${dc}`;
    const calculator = tsbCidLookup[key] || (() => ({ tsb: 0, cid: 0 }));
    return calculator(pbAmt, dcAmt);
  };

  const calculateProductBill = (pb: string | null, pbAmt: number | null) => {
    if (!pb || pbAmt == null) return '-';
    if (pb === 'Prepaid') return 0;
    if (pb === 'Due') return -pbAmt;
    if (pb === 'COD') return pbAmt;
    return '-';
  };

  const calculateDeliveryAmt = (dc: string | null, dcAmt: number | null) => {
    if (!dc || dcAmt == null) return '-';
    return `${dcAmt} (${dc})`;
  };

  const createDescription = (name: string | null, address: string | null, mobile: string | null) => {
    return [name, address, mobile].filter(Boolean).join(', ') || '-';
  };

  const shouldSkipInCalculation = (status: string | null) => {
    if (!status) return true;
    const statusLower = status.toLowerCase();
    return (
      statusLower.includes('returned') ||
      statusLower.includes('out for delivery') ||
      statusLower.includes('cancel') ||
      statusLower.includes('pending')
    );
  };

  // First pass: calculate tsb, cid, etc.
  const enhancedRecords: EnhancedDeliveryRecord[] = records.map((record) => {
    const { tsb, cid } = calculateTSBandCID(record);
    const skipInCalculation = shouldSkipInCalculation(record.status);

    return {
      ...record,
      calculatedTsb: skipInCalculation ? 0 : round(tsb),
      calculatedCid: round(cid),
      productBill: calculateProductBill(record.pb, record.pb_amt),
      deliveryAmt: calculateDeliveryAmt(record.dc, record.dc_amt),
      description: createDescription(record.name, record.address, record.mobile),
      runningBalance: 0,
      runningBalanceGpay: 0, // New field for Gpay-only balance
    };
  });

  // Sort by date ascending
  const sortedByOldest = [...enhancedRecords].sort((a, b) => {
    const aDate = a.date || '';
    const bDate = b.date || '';
    return aDate.localeCompare(bDate);
  });

  // Running balance for all TSBs and for GPay-only
  let totalBalance = 0;
  let gpayBalance = 0;

  const balanceMap = new Map<string, { total: number; gpay: number }>();

  sortedByOldest.forEach((record) => {
    const isValid = !shouldSkipInCalculation(record.status);
    const isGpay = (record.status || '').toLowerCase().includes('gpay');

    if (isValid) {
      totalBalance += record.calculatedTsb;
      totalBalance = round(totalBalance);

      if (isGpay) {
        gpayBalance += record.calculatedTsb;
        gpayBalance = round(gpayBalance);
      }
    }

    balanceMap.set(record.order_id, {
      total: totalBalance,
      gpay: gpayBalance,
    });
  });

  // Final pass: assign running balances
  return enhancedRecords.map((record) => {
    const balances = balanceMap.get(record.order_id) || { total: 0, gpay: 0 };
    return {
      ...record,
      runningBalance: balances.total,
      runningBalanceGpay: balances.gpay,
    };
  });
};
