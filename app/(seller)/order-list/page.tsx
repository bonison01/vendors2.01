'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { format, addDays, startOfMonth } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DateRangeDropdown from '@/components/DateRangeDropdown';
import { DataTable, schema, mapOrderToSchema, generateItemsListPDF } from '@/components/orders/orderUtils';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<z.infer<typeof schema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('user_id');
    if (!storedUserId) {
      setError('User ID not found. Please log in.');
      setLoading(false);
      return;
    }
    setUserId(storedUserId);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/orders/getOrderById?user_id=${userId}&startdate=${startDate}&enddate=${endDate}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch orders');
        }
        const sortedOrders = data.orders.sort((a: any, b: any) => {
          return new Date(b.order_at).getTime() - new Date(a.order_at).getTime();
        });
        const mappedOrders = sortedOrders.map(mapOrderToSchema);
        setOrders(mappedOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, startDate, endDate]);

  const handleItemList = () => {
    if (orders.length === 0) {
      toast.error('No orders available');
      return;
    }
    generateItemsListPDF(orders, 'All_Items_List.pdf');
  };

  if (!userId && !loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold">Order List</h2>
        <p className="text-red-500 mt-4">Please log in to view your orders.</p>
      </div>
    );
  }

  return (
    <ScrollArea>
      <div className="w-[100vw] md:w-full h-[calc(100svh-4rem)]">
        <div className="p-6 pt-2">
          <div className="flex justify-between gap-4">
            <h2 className="text-2xl font-semibold">Order List</h2>
            <div className='flex flex-row gap-2'>
              <Button variant="outline" onClick={handleItemList}>
                Item List
              </Button>
              <DateRangeDropdown
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
              />
            </div>
          </div>

          {loading && <p>Loading orders...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && orders.length === 0 && (
            <p>No orders found for the selected date range.</p>
          )}
          {!loading && !error && orders.length > 0 && <DataTable data={orders} />}
        </div>
      </div>
    </ScrollArea>
  );
}