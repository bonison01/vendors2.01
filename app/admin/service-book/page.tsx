// app/admin/service-book/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { format, addDays, startOfMonth } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import DateRangeDropdown from '@/components/DateRangeDropdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  schema,
  mapOrderToSchema,
  generateDeliveryItemsListPDF,
  generateReceiptPDF,
} from '@/lib/deliveryUtils';

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<z.infer<typeof schema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'Pending' | 'In Progress' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | ''>('');

  const toggleCard = (id: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const fetchOrders = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`/api/service/getAllService?startdate=${startDate}&enddate=${endDate}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to fetch');
      const sorted = data.orders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(sorted.map(mapOrderToSchema));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to fetch delivery orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate]);

  const handleStatusUpdate = async () => {
    if (!selectedOrderId || !selectedStatus) return;
    try {
      const res = await fetch(`/api/service/updateStatusById?id=${selectedOrderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update status');
      toast.success(result.message);
      await fetchOrders();
      setDialogOpen(false);
      setSelectedStatus('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleItemList = () => {
    if (orders.length === 0) {
      toast.error('No delivery orders available');
      return;
    }
    generateDeliveryItemsListPDF(orders, 'Delivery_Orders_List.pdf');
  };

  return (
    <ScrollArea>
      <div className="w-[100vw] md:w-full h-[calc(100svh-4rem)]">
        <div className="p-6 pt-2">
          <div className="flex justify-between gap-4">
            <h2 className="text-2xl font-semibold">Delivery Order List</h2>
            <div className="flex flex-row gap-2">
              {/* <Button variant="outline" onClick={handleItemList}>Item List</Button> */}
              <DateRangeDropdown startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} />
            </div>
          </div>

          {loading && <CardDescription>Loading delivery orders...</CardDescription>}
          {error && <CardDescription className="text-red-500">{error}</CardDescription>}
          {!loading && !error && orders.length === 0 && (
            <CardDescription>No delivery orders found for the selected date range.</CardDescription>
          )}

          {!loading && !error && orders.length > 0 && (
            <div className="space-y-4 mt-4">
              {orders.map((order) => {
                const isExpanded = expandedCards.has(order.id);
                return (
                  <Card key={order.id} className="w-full gap-1">
                    <CardHeader onClick={() => toggleCard(order.id)} aria-expanded={isExpanded} className="flex justify-between items-center cursor-pointer">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 w-full">
                        <div>
                          <CardTitle className="text-lg">
                            {order.updated_at ? format(new Date(order.updated_at), 'dd MMM, yyyy hh:mm a') : '-'}
                          </CardTitle>
                          <p className="text-sm font-medium">{order.pickup_name} → {order.dropoff_name}</p>
                        </div>
                        <div>
                          {order.pickup_cord && order.dropoff_cord && (
                            <div className="flex text-sm gap-2 items-center">
                              <p className="font-medium">Route:</p>
                              <a href={`https://www.google.com/maps/dir/${order.pickup_cord}/${order.dropoff_cord}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                View Route in Google Maps
                              </a>
                            </div>
                          )}
                          <div className="flex text-sm gap-2 items-center">
                            <p className="font-medium">Status:</p>
                            <p>{order.status || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp /> : <ChevronDown />}
                    </CardHeader>

                    <CardContent className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                      <div className="flex justify-end gap-4 mb-2">
                        <Button className="text-white" onClick={() => generateReceiptPDF(order)}>
                          <Download /> Receipt
                        </Button>
                        <Dialog open={dialogOpen && selectedOrderId === order.id} onOpenChange={(open) => {
                          setDialogOpen(open);
                          setSelectedOrderId(open ? order.id : null);
                          setSelectedStatus(open ? (order.status as any || '') : '');
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline">Update Status</Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Update Order Status</DialogTitle>
                              <DialogDescription>Select a new status for Order #{order.id}.</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select status" /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="In Progress">In Progress</SelectItem>
                                  <SelectItem value="Out for Delivery">Out for Delivery</SelectItem>
                                  <SelectItem value="Delivered">Delivered</SelectItem>
                                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                              <Button onClick={handleStatusUpdate} disabled={!selectedStatus} className="text-white">Update</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                        <div>
                          <CardDescription className="font-medium">Pickup Details</CardDescription>
                          <p>Name: {order.pickup_name}</p>
                          <p>Phone: {order.pickup_phone}</p>
                          <p>Address: {order.pickup_cord ? <a href={`https://www.google.com/maps?q=${order.pickup_cord}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{order.pickup_address}</a> : order.pickup_address}</p>
                          <p>Instructions: {typeof order.instructions?.pickup === 'string' && order.instructions.pickup.trim() ? order.instructions.pickup : '-'}</p>
                        </div>

                        <div>
                          <CardDescription className="font-medium">Dropoff Details</CardDescription>
                          <p>Name: {order.dropoff_name}</p>
                          <p>Phone: {order.dropoff_phone}</p>
                          <p>Address: {order.dropoff_cord ? <a href={`https://www.google.com/maps?q=${order.dropoff_cord}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{order.dropoff_address}</a> : order.dropoff_address}</p>
                          <p>Instructions: {typeof order.instructions?.dropoff === 'string' && order.instructions.dropoff.trim() ? order.instructions.dropoff : '-'}</p>
                        </div>

                        <div>
                          <CardDescription className="font-medium">Charge</CardDescription>
                          <p>{order.charge ? `₹${order.charge.toFixed(2)}` : 'N/A'}</p>
                        </div>
                        <div>
                          <CardDescription className="font-medium">Distance</CardDescription>
                          <p>{order.distance ? `${order.distance.toFixed(2)} km` : 'N/A'}</p>
                        </div>
                        <div>
                          <CardDescription className="font-medium">Booked At</CardDescription>
                          <p>{format(new Date(order.created_at), 'PPpp')}</p>
                        </div>
                        <div>
                          <CardDescription className="font-medium">Is Business</CardDescription>
                          <p>{order.isBusiness ? 'Yes' : 'No'}</p>
                        </div>

                        <div className="lg:col-span-2">
                          <CardDescription className="font-medium">Customer</CardDescription>
                          <p>{order.customers?.name ?? 'N/A'}</p>
                          {order.customers?.email && <p>Email: {order.customers.email}</p>}
                          {order.customers?.phone && <p>Phone: {order.customers.phone}</p>}
                        </div>
                        <div className="lg:col-span-2">
                          <CardDescription className="font-medium">Business</CardDescription>
                          <p>{order.users?.business_name ?? 'N/A'}</p>
                          {order.users?.phone && <p>Phone: {order.users.phone}</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
