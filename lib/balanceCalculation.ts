import { DeliveryRecord, EnhancedDeliveryRecord } from '@/types/delivery-record';

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

    const key = `${pb}_${dc}`;
    const calculator = tsbCidLookup[key] || (() => ({ tsb: 0, cid: 0 }));
    return calculator(pbAmt, dcAmt);
  };

  const calculateProductBill = (pb: string | null, pbAmt: number | null) => {
    if (!pb || !pbAmt) return '-';
    if (pb === 'Prepaid') return 0;
    if (pb === 'Due') return -pbAmt;
    if (pb === 'COD') return pbAmt;
    return '-';
  };

  const calculateDeliveryAmt = (dc: string | null, dcAmt: number | null) => {
    if (!dc || !dcAmt) return '-';
    return `${dcAmt} (${dc})`;
  };

  const createDescription = (name: string | null, address: string | null, mobile: string | null) => {
    return [name, address, mobile].filter(Boolean).join(', ') || '-';
  };

  const enhancedRecords: EnhancedDeliveryRecord[] = records.map((record) => {
    const { tsb, cid } = calculateTSBandCID(record);
    return {
      ...record,
      calculatedTsb: tsb,
      calculatedCid: cid,
      productBill: calculateProductBill(record.pb, record.pb_amt),
      deliveryAmt: calculateDeliveryAmt(record.dc, record.dc_amt),
      description: createDescription(record.name, record.address, record.mobile),
      runningBalance: 0,
    };
  });

  const sortedByOldest = [...enhancedRecords].sort((a, b) => {
    const aDate = a.date || '';
    const bDate = b.date || '';
    return aDate.localeCompare(bDate);
  });

  let runningSum = 0;
  const balanceMap = new Map<string, number>();
  sortedByOldest.forEach((record) => {
    runningSum += record.calculatedTsb;
    balanceMap.set(record.order_id, runningSum);
  });

  return enhancedRecords.map((record) => ({
    ...record,
    runningBalance: balanceMap.get(record.order_id) || 0,
  }));
};