'use client';

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { format, addDays, startOfMonth } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';
import DateRangeDropdown from '@/components/DateRangeDropdown';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
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

// Zod schema for delivery orders
export const schema = z.object({
  id: z.number(),
  pickup_name: z.string(),
  pickup_phone: z.string(),
  pickup_address: z.string(),
  dropoff_name: z.string(),
  dropoff_phone: z.string(),
  dropoff_address: z.string(),
  instructions: z.record(z.unknown()).nullable(),
  distance: z.number().nullable(),
  charge: z.number().nullable(),
  created_at: z.string().datetime(),
  pickup_cord: z.string().nullable(),
  dropoff_cord: z.string().nullable(),
  status: z.string().nullable(),
  updated_at: z.string().datetime().nullable(),
  customer_id: z.string().nullable(),
  isBusiness: z.number().nullable(),
  business_id: z.string().nullable(),
  users: z
    .object({
      user_id: z.string(),
      business_name: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .nullable(),
  customers: z
    .object({
      customer_id: z.string(),
      name: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
    })
    .nullable(),
});

// Map API response to schema
export const mapOrderToSchema = (order: any): z.infer<typeof schema> => {
  return schema.parse({
    id: order.id,
    pickup_name: order.pickup_name,
    pickup_phone: order.pickup_phone,
    pickup_address: order.pickup_address,
    dropoff_name: order.dropoff_name,
    dropoff_phone: order.dropoff_phone,
    dropoff_address: order.dropoff_address,
    instructions: order.instructions,
    distance: order.distance,
    charge: order.charge,
    created_at: order.created_at,
    pickup_cord: order.pickup_cord,
    dropoff_cord: order.dropoff_cord,
    status: order.status,
    updated_at: order.updated_at,
    customer_id: order.customer_id,
    isBusiness: order.isBusiness,
    business_id: order.business_id,
    users: order.users
      ? {
          user_id: order.users.user_id,
          business_name: order.users.business_name,
          phone: order.users.phone,
        }
      : null,
    customers: order.customers
      ? {
          customer_id: order.customers.customer_id,
          name: order.customers.name,
          email: order.customers.email,
          phone: order.customers.phone,
        }
      : null,
  });
};

// Generate PDF for delivery orders list
export const generateDeliveryItemsListPDF = (
  orders: z.infer<typeof schema>[],
  filename: string
) => {
  const doc = new jsPDF();
  doc.setFontSize(12);
  doc.text('Delivery Orders List', 10, 10);
  let y = 20;

  orders.forEach((order, index) => {
    doc.text(`Order ${index + 1}`, 10, y);
    y += 10;
    doc.text(`ID: ${order.id}`, 10, y);
    y += 10;
    doc.text(`Pickup: ${order.pickup_name}, ${order.pickup_phone}, ${order.pickup_address}`, 10, y);
    if (order.pickup_cord) {
      y += 8;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(`[View Pickup on Map]`, 10, y, {
        url: `https://www.google.com/maps?q=${order.pickup_cord}`,
      });
      doc.setTextColor(40, 40, 40);
    }
    y += 10;
    doc.text(`Dropoff: ${order.dropoff_name}, ${order.dropoff_phone}, ${order.dropoff_address}`, 10, y);
    if (order.dropoff_cord) {
      y += 8;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(`[View Dropoff on Map]`, 10, y, {
        url: `https://www.google.com/maps?q=${order.dropoff_cord}`,
      });
      doc.setTextColor(40, 40, 40);
    }
    y += 10;
    doc.text(`Status: ${order.status || 'N/A'}`, 10, y);
    y += 10;
    doc.text(`Charge: ${order.charge ? `₹${order.charge.toFixed(2)}` : 'N/A'}`, 10, y);
    y += 10;
    doc.text(`Created: ${format(new Date(order.created_at), 'PPpp')}`, 10, y);
    if (order.pickup_cord && order.dropoff_cord) {
      y += 8;
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(`[View Route on Map]`, 10, y, {
        url: `https://www.google.com/maps/dir/${order.pickup_cord}/${order.dropoff_cord}`,
      });
      doc.setTextColor(40, 40, 40);
    }
    y += 10;
    if (order.users) {
      doc.text(`Business: ${order.users.business_name || 'N/A'}`, 10, y);
      y += 10;
    }
    if (order.customers) {
      doc.text(`Customer: ${order.customers.name || 'N/A'}`, 10, y);
      y += 10;
    }
    y += 10;

    if (y > 270) {
      doc.addPage();
      y = 10;
    }
  });

  doc.save(filename);
};

// Generate PDF for individual order receipt
export const generateReceiptPDF = (order: z.infer<typeof schema>) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');

  // Header
  doc.setFillColor(0, 128, 0);
  doc.rect(0, y - 10, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Mateng - Delivery Receipt', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Order Details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Service Booked ID: SB-${order.id}`, 20, y);
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Pickup Details -', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.pickup_name}`, 24, y);
  y += 8;
  doc.text(`Phone: ${order.pickup_phone}`, 24, y);
  y += 8;
  const pickupAddressLines = doc.splitTextToSize(`Address: ${order.pickup_address}`, 140);
  pickupAddressLines.forEach((line: string) => {
    doc.text(line, 24, y);
    y += 8;
  });
  if (order.pickup_cord) {
    y += 8;
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(`[View Pickup on Map]`, 24, y, {
      url: `https://www.google.com/maps?q=${order.pickup_cord}`,
    });
    doc.setTextColor(40, 40, 40);
  }
  y += 8;
  doc.text(
    `Instruction: ${order.instructions?.pickup && typeof order.instructions.pickup === 'string' ? order.instructions.pickup : 'N/A'}`,
    24,
    y
  );
  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.text('Dropoff Details -', 20, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${order.dropoff_name}`, 24, y);
  y += 8;
  doc.text(`Phone: ${order.dropoff_phone}`, 24, y);
  y += 8;
  const dropoffAddressLines = doc.splitTextToSize(`Address: ${order.dropoff_address}`, 140);
  dropoffAddressLines.forEach((line: string) => {
    doc.text(line, 24, y);
    y += 8;
  });
  if (order.dropoff_cord) {
    y += 8;
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(`[View Dropoff on Map]`, 24, y, {
      url: `https://www.google.com/maps?q=${order.dropoff_cord}`,
    });
    doc.setTextColor(40, 40, 40);
  }
  y += 8;
  doc.text(
    `Instruction: ${order.instructions?.dropoff && typeof order.instructions.dropoff === 'string' ? order.instructions.dropoff : 'N/A'}`,
    24,
    y
  );
  if (order.pickup_cord && order.dropoff_cord) {
    y += 8;
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(`[View Route on Map]`, 24, y, {
      url: `https://www.google.com/maps/dir/${order.pickup_cord}/${order.dropoff_cord}`,
    });
    doc.setTextColor(40, 40, 40);
  }
  y += 12;
  doc.text(`Status: ${order.status || 'N/A'}`, 20, y);
  y += 8;
  doc.text(`Order Date: ${format(new Date(order.created_at), 'dd MMM, yyyy - h:mm a')}`, 20, y);
  y += 12;

  // Delivery Details
  doc.setFillColor(220, 220, 220);
  doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Details', 25, y);
  doc.text('Value', 160, y);
  y += 8;
  doc.line(20, y, 190, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.text('Distance', 25, y);
  doc.text(order.distance !== null ? `${order.distance.toFixed(2)} km` : 'N/A', 185, y, { align: 'right' });
  y += 8;
  doc.text('Charge', 25, y);
  doc.setTextColor(0, 150, 0);
  doc.text(order.charge !== null ? `Rs.${order.charge.toFixed(2)}` : 'N/A', 185, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y += 8;
  doc.text('Business Order', 25, y);
  doc.text(order.isBusiness !== null ? (order.isBusiness ? 'Yes' : 'No') : 'No', 185, y, { align: 'right' });

  // Save PDF
  doc.save(`Delivery_Receipt_${order.id}.pdf`);
};

// Main component
export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<z.infer<typeof schema>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<
    'Pending' | 'In Progress' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | ''
  >('');

  // Toggle card expansion
  const toggleCard = (id: number) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Handle status update
  const handleStatusUpdate = async () => {
    if (!selectedOrderId || !selectedStatus) return;
    try {
      const response = await fetch(`/api/service/updateStatusById?id=${selectedOrderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ status: selectedStatus }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      toast.success(data.message);
      // Refresh orders
      const refreshed = await fetch(
        `/api/service/getAllService?startdate=${startDate}&enddate=${endDate}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        }
      );
      const refreshedData = await refreshed.json();
      if (refreshed.ok) {
        const sortedOrders = refreshedData.orders.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setOrders(sortedOrders.map(mapOrderToSchema));
      } else {
        throw new Error(refreshedData.message);
      }
      setDialogOpen(false);
      setSelectedStatus('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/service/getAllService?startdate=${startDate}&enddate=${endDate}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch delivery orders');
        }
        const sortedOrders = data.orders.sort((a: any, b: any) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        const mappedOrders = sortedOrders.map(mapOrderToSchema);
        setOrders(mappedOrders);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        toast.error('Failed to fetch delivery orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [startDate, endDate]);

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
              {/* <Button variant="outline" onClick={handleItemList}>
                Item List
              </Button> */}
              <DateRangeDropdown
                startDate={startDate}
                setStartDate={setStartDate}
                endDate={endDate}
                setEndDate={setEndDate}
              />
            </div>
          </div>

          {loading && <CardDescription>Loading delivery orders...</CardDescription>}
          {error && <CardDescription className="text-red-500">{error}</CardDescription>}
          {!loading && !error && orders.length === 0 && (
            <CardDescription>No delivery orders found for the selected date range.</CardDescription>
          )}

          {/* Card view for all screens */}
          {!loading && !error && orders.length > 0 && (
            <div className="space-y-4 mt-4">
              {orders.map((order) => {
                const isExpanded = expandedCards.has(order.id);
                return (
                  <Card key={order.id} className="w-full gap-1">
                    <CardHeader
                      className="flex flex-row items-center justify-between cursor-pointer"
                      onClick={() => toggleCard(order.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-4 w-full">
                        <div>
                          <CardTitle className="text-lg">
                            {order.updated_at ? format(new Date(order.updated_at), 'dd MMM, yyyy hh:mm a') : '-'}
                          </CardTitle>
                          <p className="text-sm font-medium">
                            {order.pickup_name} → {order.dropoff_name}
                          </p>
                        </div>
                        <div>
                          {order.pickup_cord && order.dropoff_cord && (
                            <div className="flex text-sm flex-row gap-2">
                              <p className="font-medium">Route:</p>
                              <a
                                href={`https://www.google.com/maps/dir/${order.pickup_cord}/${order.dropoff_cord}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Route in Google Maps
                              </a>
                            </div>
                          )}
                          <div className="flex text-sm flex-row gap-2">
                            <p className="font-medium">Status:</p>
                            <p>{order.status || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 min-w-fit">
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </div>
                    </CardHeader>
                    <CardContent
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="w-full flex justify-end gap-4">
                        <Button className="text-white" onClick={() => generateReceiptPDF(order)}>
                          <Download /> Receipt
                        </Button>
                        <Dialog
                          open={dialogOpen && selectedOrderId === order.id}
                          onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (open) {
                              setSelectedOrderId(order.id);
                              setSelectedStatus(order.status as any || '');
                            } else {
                              setSelectedOrderId(null);
                              setSelectedStatus('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button variant="outline" className="dark:border-green-600/50">
                              Update Status
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                              <DialogTitle>Update Order Status</DialogTitle>
                              <DialogDescription>
                                Select a new status for Order #{order.id}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <Select
                                value={selectedStatus}
                                onValueChange={(value) =>
                                  setSelectedStatus(
                                    value as 'Pending' | 'In Progress' | 'Out for Delivery' | 'Delivered' | 'Cancelled'
                                  )
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
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
                              <Button
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleStatusUpdate}
                                disabled={!selectedStatus}
                                className="text-white"
                              >
                                Update
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        {/* Common details for all screens */}
                        <div>
                          <CardDescription className="font-medium mt-2 mb-1">Pickup Details</CardDescription>
                          <p>Name:   {order.pickup_name}</p>
                          <p>Phone:   {order.pickup_phone}</p>
                          <p>
                            Address:  
                            {order.pickup_cord ? (
                              <a
                                href={`https://www.google.com/maps?q=${order.pickup_cord}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {order.pickup_address}
                              </a>
                            ) : (
                              order.pickup_address
                            )}
                          </p>
                          <p>
                            Instructions:  
                            {(typeof order.instructions?.pickup === 'string' && order.instructions.pickup.trim())
                              ? order.instructions.pickup
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <CardDescription className="font-medium mt-2 mb-1">Dropoff Details</CardDescription>
                          <p>Name:   {order.dropoff_name}</p>
                          <p>Phone:   {order.dropoff_phone}</p>
                          <p>
                            Address:  
                            {order.dropoff_cord ? (
                              <a
                                href={`https://www.google.com/maps?q=${order.dropoff_cord}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {order.dropoff_address}
                              </a>
                            ) : (
                              order.dropoff_address
                            )}
                          </p>
                          <p>
                            Instructions:  
                            {(typeof order.instructions?.dropoff === 'string' && order.instructions.dropoff.trim())
                              ? order.instructions.dropoff
                              : '-'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          {/* Additional details for large screens (md and up) */}
                          <div className="">
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
                          <div className="col-span-2">
                            <CardDescription className="font-medium my-2">Customer</CardDescription>
                            <p>{order.customers?.name || 'N/A'}</p>
                            {order.customers?.email && <p>Email: {order.customers.email}</p>}
                            {order.customers?.phone && <p>Phone: {order.customers.phone}</p>}
                          </div>
                          <div className="col-span-2">
                            <CardDescription className="font-medium my-2">Business</CardDescription>
                            <p>{order.users?.business_name || 'N/A'}</p>
                            {order.users?.phone && <p>Phone: {order.users.phone}</p>}
                          </div>
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