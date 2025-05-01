'use client'

import React, { useEffect, useState } from 'react';
import { useAppSelector } from "@/hooks/useAppSelector"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeliveryRecord {
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

interface EnhancedDeliveryRecord extends DeliveryRecord {
  calculatedTsb: number;
  calculatedCid: number;
  productBill: string | number;
  deliveryAmt: string;
  description: string;
}

export default function DeliveryRecordsPage() {
  const [records, setRecords] = useState<EnhancedDeliveryRecord[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const vendor_id = useAppSelector((state) => state.user.user?.vendor_id);

  // Lookup table for TSB and CID calculations
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

  // Function to calculate TSB and CID based on pb and dc
  const calculateTSBandCID = (record: DeliveryRecord) => {
    const pb = record.pb || '';
    const dc = record.dc || '';
    const pbAmt = record.pb_amt || 0;
    const dcAmt = record.dc_amt || 0;

    const key = `${pb}_${dc}`;
    const calculator = tsbCidLookup[key] || (() => ({ tsb: 0, cid: 0 }));
    return calculator(pbAmt, dcAmt);
  };

  // Function to calculate Product Bill
  const calculateProductBill = (pb: string | null, pbAmt: number | null) => {
    if (!pb || !pbAmt) return '-';
    if (pb === 'Prepaid') return 0;
    if (pb === 'Due') return -pbAmt;
    if (pb === 'COD') return pbAmt;
    return '-';
  };

  // Function to calculate Delivery Amt
  const calculateDeliveryAmt = (dc: string | null, dcAmt: number | null) => {
    if (!dc || !dcAmt) return '-';
    return `${dcAmt} (${dc})`;
  };

  // Function to create Description
  const createDescription = (name: string | null, address: string | null, mobile: string | null) => {
    return [name, address, mobile].filter(Boolean).join(', ') || '-';
  };

  useEffect(() => {
    const fetchDeliveryRecords = async () => {
      if (!vendor_id) {
        setError('Vendor ID not found. Please log in.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/parcel/getById?vendor_id=${vendor_id}`);
        const data = await response.json();

        if (!response.ok) {
          if (data.message === 'No delivery records found for this vendor_id') {
            setError('No delivery records found');
          } else {
            throw new Error(data.error || 'Failed to fetch delivery records');
          }
        } else {
          // Enhance records with calculated fields
          const enhancedRecords: EnhancedDeliveryRecord[] = data.deliveryRecords.map((record: DeliveryRecord) => {
            const { tsb, cid } = calculateTSBandCID(record);
            return {
              ...record,
              calculatedTsb: tsb,
              calculatedCid: cid,
              productBill: calculateProductBill(record.pb, record.pb_amt),
              deliveryAmt: calculateDeliveryAmt(record.dc, record.dc_amt),
              description: createDescription(record.name, record.address, record.mobile),
            };
          });

          enhancedRecords.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

          // Calculate total balance (sum of TSB)
          const balance = enhancedRecords.reduce((sum, record) => sum + record.calculatedTsb, 0);

          setRecords(enhancedRecords);
          setTotalBalance(balance);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeliveryRecords();
  }, [vendor_id]);

  return (
    <ScrollArea>
      <div className="w-full h-[calc(100svh-4rem)]">
        <div className="mx-auto p-4">
          <Card className="mb-6  max-w-100">
            <CardContent className='flex flex-col gap-2'>
              <CardTitle>Total Balance</CardTitle>
              <p className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{totalBalance.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
              {error && (
                <div className="text-gray-500 text-center p-4">
                  {error}
                </div>
              )}
              {!loading && !error && records.length === 0 && (
                <div className="text-center p-4">
                  No delivery records found.
                </div>
              )}
              {!loading && !error && records.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Product Bill</TableHead>
                      <TableHead>Delivery Amt</TableHead>
                      <TableHead>TSB</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.order_id}>
                        <TableCell>{record.date ? new Date(record.date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>{record.order_id}</TableCell>
                        <TableCell>{record.description}</TableCell>
                        <TableCell>{record.mode || '-'}</TableCell>
                        <TableCell>{record.productBill}</TableCell>
                        <TableCell>{record.deliveryAmt}</TableCell>
                        <TableCell>{record.calculatedTsb}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === 'Delivered' ? 'default' : 'secondary'}>
                            {record.status || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>{record.note || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ScrollArea>
  );
}