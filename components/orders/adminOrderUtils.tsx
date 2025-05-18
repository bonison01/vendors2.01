'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import { format, isValid } from 'date-fns';
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
} from '@tabler/icons-react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PackageX, PackageCheck, Bike, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';

// Schema for DataTable
export const schema = z.object({
  id: z.number(),
  order_id: z.string(),
  order_at: z.string(),
  status: z.string(),
  total_calculated_price: z.string(),
  item_count: z.string(),
  buyer_name: z.string(),
  buyer_address: z.string().optional(),
  buyer_phone: z.string().optional(),
  email: z.string().optional(),
  landmark: z.string().optional(),
  customers: z.object({
    customer_id: z.string(),
    name: z.string(),
    email: z.string(),
    phone: z.string(),
  }),
  stores: z
    .array(
      z.object({
        store_id: z.string(),
        business_name: z.string(),
        phone: z.string().optional(),
        items: z.array(
          z.object({
            order_id: z.string(),
            product_id: z.string(),
            quantity: z.number(),
            product_name: z.string(),
            price_inr: z.number(),
            discounted_price: z.number(),
            user_name: z.string(),
          })
        ),
      })
    )
    .optional(),
  is_ordered: z.number().optional(),
});

// Map API response to schema
export const mapOrderToSchema = (order: any) => ({
  id: order.id,
  order_id: order.order_id,
  order_at: new Date(order.order_at), // Keep it as a Date object
  status: order.status,
  total_calculated_price: order.total_calculated_price.toString(),
  item_count: order.item_count.toString(),
  buyer_name: order.buyer_name,
  buyer_address: order.buyer_address,
  buyer_phone: order.buyer_phone,
  email: order.email,
  landmark: order.landmark,
  stores: order.stores,
  is_ordered: order.is_ordered,
  customers: {
    customer_id: order.customers.customer_id,
    name: order.customers.name,
    email: order.customers.email,
    phone: order.customers.phone,
  },
});


// Generate Receipt PDF
// import { format, isValid } from 'date-fns';

// Generate Receipt PDF
export const generateReceiptPDF = (orderData: z.infer<typeof schema>) => {
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
  doc.text('Mateng - Thank You for Ordering', pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Order Details
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text(`Order ID: ${orderData.order_id}`, 20, y);
  y += 8;
  doc.text(`Name: ${orderData.buyer_name}`, 20, y);
  y += 8;
  doc.text(`Address: ${orderData.buyer_address || 'N/A'}`, 20, y);
  y += 8;
  doc.text(`Phone: ${orderData.buyer_phone || 'N/A'}`, 20, y);
  y += 8;
  doc.text(`Email: ${orderData.email || 'N/A'}`, 20, y);
  y += 8;
  doc.text(`Landmark: ${orderData.landmark || 'N/A'}`, 20, y);
  y += 8;
  doc.text(`Payment Mode: Cash on Delivery`, 20, y);
  y += 8;

  // Check if the date is valid before formatting
  const orderDate = orderData.order_at;
  let formattedOrderDate = 'Invalid Date';

  if (isValid(orderDate)) {
    formattedOrderDate = format(orderDate, 'dd MMM, yyyy - h:mm a');
  }

  doc.text(`Order Date: ${formattedOrderDate}`, 20, y);
  y += 12;

  // Calculate totals
  let totalMrp = 0;
  let totalDiscounted = 0;
  orderData.stores?.forEach((store) => {
    store.items.forEach((item) => {
      totalMrp += item.price_inr * item.quantity;
      totalDiscounted += item.discounted_price * item.quantity;
    });
  });

  // Store and Items
  orderData.stores?.forEach((store) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Store: ${store.business_name}`, 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFillColor(220, 220, 220);
    doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Product Name', 25, y);
    doc.text('Qty', 100, y);
    doc.text('MRP', 130, y);
    doc.text('Offer Price', 160, y);
    y += 8;
    doc.line(20, y, 190, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    store.items.forEach((item) => {
      doc.text(item.product_name, 25, y, { maxWidth: 70 });
      doc.text(item.quantity.toString(), 100, y);
      doc.text(`Rs. ${item.price_inr.toFixed(2)}`, 140, y, { align: 'right' });
      doc.setTextColor(0, 150, 0);
      doc.text(`Rs. ${item.discounted_price.toFixed(2)}`, 185, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      y += 8;
    });

    y += 10;
  });

  doc.setFillColor(240, 240, 240);
  doc.rect(20, y - 5, pageWidth - 40, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text(`Total MRP:`, 25, y);
  doc.text(`Rs. ${totalMrp.toFixed(2)}`, 185, y, { align: 'right' });
  y += 10;
  const discount = totalMrp - totalDiscounted;
  doc.setTextColor(200, 0, 0);
  doc.text(`You saved:`, 25, y);
  doc.text(`-Rs. ${discount.toFixed(2)}`, 185, y, { align: 'right' });
  doc.setTextColor(0, 0, 0);
  y += 10;
  doc.setFontSize(14);
  doc.setTextColor(0, 150, 0);
  doc.text(`Payable Amount:`, 25, y);
  doc.text(`Rs. ${totalDiscounted.toFixed(2)}`, 185, y, { align: 'right' });

  try {
    doc.save(`Receipt_${orderData.order_id}.pdf`);
  } catch (error) {
    console.error('PDF generation failed:', error);
    toast.error('Failed to generate receipt');
  }
};


// Generate Items List PDF
export const generateItemsListPDF = (orders: z.infer<typeof schema>[], filename: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');

  doc.setFillColor(0, 128, 0);
  doc.rect(0, y - 10, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Mateng - Items List', pageWidth / 2, y, { align: 'center' });
  y += 15;

  const storeMap: {
    [storeId: string]: {
      business_name: string;
      items: { product_name: string; discounted_price: number; quantity: number }[];
    };
  } = {};

  orders.forEach((order) => {
    order.stores?.forEach((store) => {
      if (!storeMap[store.store_id]) {
        storeMap[store.store_id] = {
          business_name: store.business_name,
          items: [],
        };
      }

      store.items.forEach((item) => {
        const existingItem = storeMap[store.store_id].items.find(
          (i) => i.product_name === item.product_name
        );
        if (existingItem) {
          existingItem.quantity += item.quantity;
          if (existingItem.discounted_price !== item.discounted_price) {
            console.warn(
              `Price mismatch for ${item.product_name} in store ${store.business_name}`
            );
            existingItem.discounted_price = item.discounted_price;
          }
        } else {
          storeMap[store.store_id].items.push({
            product_name: item.product_name,
            discounted_price: item.discounted_price,
            quantity: item.quantity,
          });
        }
      });
    });
  });

  Object.entries(storeMap).forEach(([storeId, store]) => {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Store: ${store.business_name}`, 20, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFillColor(220, 220, 220);
    doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item Name', 25, y, { maxWidth: 80 });
    doc.text('Price', 110, y);
    doc.text('Quantity', 150, y);
    y += 8;
    doc.line(20, y, 190, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    store.items.forEach((item) => {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
      doc.text(item.product_name, 25, y, { maxWidth: 80 });
      doc.text(`Rs. ${item.discounted_price.toFixed(2)}`, 110, y);
      doc.text(item.quantity.toString(), 150, y);
      y += 8;
    });

    const totalQuantity = store.items.reduce((sum, item) => sum + item.quantity, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Quantity: ${totalQuantity}`, 150, y);
    y += 10;
  });

  try {
    doc.save(filename);
  } catch (error) {
    console.error('Items List PDF generation failed:', error);
    toast.error('Failed to generate items list');
  }
};

// Drag Handle Component
export function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

// TableCellViewer for Drawer
export function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile();

  return (
    <Drawer direction={isMobile ? 'bottom' : 'right'}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-green-500 underline w-fit px-0 text-left">
          {item.order_id}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <div className="w-full flex flex-row justify-between">
            <DrawerTitle>{item.order_id}</DrawerTitle>
            <DrawerTitle>
              {item.order_at && !isNaN(new Date(item.order_at).getTime())
                ? format(new Date(item.order_at), 'dd MMM, yy')
                : 'Invalid date'}
            </DrawerTitle>

            {/* <DrawerTitle>{format(new Date(item.order_at), 'dd MMM, yy')}</DrawerTitle> */}
          </div>
          <DrawerDescription>Full details for the selected order</DrawerDescription>
        </DrawerHeader>
        <ScrollArea>
          <div className="flex flex-col gap-1 text-sm px-4 h-[70vh] md:h-[80vh]">
            <DrawerTitle className="mb-2 text-base">Account Details</DrawerTitle>
            <div className="flex flex-row gap-3">
              <Label>Name:</Label> {item.customers.name || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Phone:</Label> {item.customers.phone || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Email:</Label> {item.customers.email || 'N/A'}
            </div>

            <DrawerTitle className="mt-3 mb-2 text-base">Shipping Details</DrawerTitle>
            <div className="flex flex-row gap-3">
              <Label>Name:</Label> {item.buyer_name || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Address:</Label> {item.buyer_address || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Phone:</Label> {item.buyer_phone || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Email:</Label> {item.email || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Landmark:</Label> {item.landmark || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Order Date:</Label>{' '}
              {item.order_at && !isNaN(new Date(item.order_at).getTime())
                ? format(new Date(item.order_at), 'dd MMM, yyyy')
                : 'N/A'}

              {/* {format(new Date(item.order_at), 'dd MMM, yyyy') || 'N/A'} */}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Status:</Label> {item.status || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Total Price:</Label> ₹{item.total_calculated_price || 'N/A'}
            </div>
            <div className="flex flex-row gap-3">
              <Label>Item Count:</Label> {item.item_count || 'N/A'}
            </div>
            <div>
              <DrawerTitle className="text-gray-400 mt-3 text-base">Stores and Items:</DrawerTitle>
              {item.stores?.length ? (
                item.stores.map((store) => (
                  <div key={store.store_id} className="mt-4">
                    <h4 className="font-semibold mb-2">
                      {store.business_name} - {store.phone || 'N/A'}
                    </h4>
                    <ol className="list-decimal ml-8">
                      {store.items.map((orderItem) => (
                        <li key={`${item.order_id}-${orderItem.product_id}`} className="mb-1">
                          {orderItem.product_name} (Qty: {orderItem.quantity}, Price: ₹
                          {orderItem.discounted_price})
                        </li>
                      ))}
                    </ol>
                  </div>
                ))
              ) : (
                <p>No items available</p>
              )}
            </div>
          </div>
        </ScrollArea>
        <DrawerFooter className="flex flex-row justify-between gap-4">
          <Button
            variant="default"
            className="text-white"
            onClick={() => generateReceiptPDF(item)}
          >
            <FileDown className="text-white mr-2" /> Invoice
          </Button>
          <DrawerClose asChild>
            <Button
              variant="outline"
              className="dark:bg-zinc-100 dark:hover:bg-zinc-200 text-black hover:text-black"
            >
              Close
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

// Columns for DataTable
export const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'order_id',
    header: 'Order ID',
    cell: ({ row }) => <TableCellViewer item={row.original} />,
    enableHiding: false,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === 'ordered' ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-blue-400 mr-1" />
        ) : (
          <IconLoader className="mr-1" />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: 'buyer_name',
    header: 'Name',
    cell: ({ row }) => <div>{row.original.buyer_name}</div>,
  },
  {
    accessorKey: 'buyer_phone',
    header: 'Contact No',
    cell: ({ row }) => <div>{row.original.buyer_phone}</div>,
  },
  {
    accessorKey: 'total_calculated_price',
    header: () => <div className="w-full text-right">Total Price</div>,
    cell: ({ row }) => <div className="text-right">₹{row.original.total_calculated_price}</div>,
  },
  {
    accessorKey: 'item_count',
    header: () => <div className="w-full text-right">Items</div>,
    cell: ({ row }) => <div className="text-right">{row.original.item_count}</div>,
  },
  {
    accessorKey: 'order_at',
    header: 'Ordered At',
    // cell: ({ row }) => <div>{format(new Date(row.original.order_at), 'dd MMM, yy')}</div>,
    cell: ({ row }) => {
      const orderAt = row.original.order_at;
      const date = new Date(orderAt);

      return (
        <div>
          {orderAt && !isNaN(date.getTime()) ? format(date, 'dd MMM, yy') : 'N/A'}
        </div>
      );
    },

  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem className="flex flex-row gap-2" onClick={() => generateReceiptPDF(row.original)}>
            <FileDown className="text-white" /> Invoice
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <Label className="text-gray-300 mb-2">Change Status</Label>
          <DropdownMenuItem className="flex flex-row ml-1 gap-2">
            <Bike className="text-white" /> Out for Delivery
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-row ml-1 gap-2">
            <PackageCheck className="text-white" /> Delivered
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-row ml-1 gap-2">
            <PackageX className="text-white" /> Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

// DraggableRow Component
export function DraggableRow({ row }: { row: any }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && 'selected'}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell: any) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

// DataTable Component
export function DataTable({ data }: { data: z.infer<typeof schema>[] }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [tableData, setTableData] = React.useState(data);
  const [expandedCards, setExpandedCards] = React.useState<Set<string>>(new Set());
  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => tableData?.map(({ id }) => id) || [],
    [tableData]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, filterValue) => {
      return Object.values(row.original).some((value) =>
        String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase())
      );
    },
  });

  // Toggle card expansion
  const toggleCard = (id: string) => {
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setTableData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  const handleSelectedItemsList = () => {
    const selectedOrders = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original);
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }
    generateItemsListPDF(selectedOrders, 'Selected_Items_List.pdf');
  };

  const handleDownloadInvoices = () => {
    const selectedOrders = table
      .getFilteredSelectedRowModel()
      .rows.map((row) => row.original);
    if (selectedOrders.length === 0) {
      toast.error('No orders selected');
      return;
    }
    selectedOrders.forEach((order) => {
      generateReceiptPDF(order);
    });
  };

  // Card view pagination
  const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
  const cardPageCount = Math.ceil(filteredRows.length / table.getState().pagination.pageSize);
  const paginatedRows = filteredRows.slice(
    table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize
  );

  return (
    <>
      <div className="flex items-center justify-between gap-4 my-2">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm ml-1"
        />
        <div className="flex flex-col sm:flex-row items-end gap-2">
          {Object.keys(rowSelection).length > 0 && (
            <div className="flex flex-row gap-2">
              <Button variant="outline" onClick={handleSelectedItemsList}>
                Selected Items List
              </Button>
              <Button variant="outline" onClick={handleDownloadInvoices}>
                Download Invoices
              </Button>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card view for small screens */}
      <div className="md:hidden space-y-4">
        {paginatedRows.length ? (
          paginatedRows.map((row) => {
            const isExpanded = expandedCards.has(row.id.toString());
            return (
              <Card key={row.id} className="w-full">
                <CardHeader
                  className="flex flex-row items-center justify-between cursor-pointer"
                  onClick={() => toggleCard(row.id.toString())}
                >
                  <div className="flex flex-col">
                    <CardTitle className="text-lg">
                      <TableCellViewer item={row} />
                    </CardTitle>
                    <p className="text-sm font-medium">
                      {row.order_at && !isNaN(new Date(row.order_at).getTime()) ? (
                        format(new Date(row.order_at), 'dd MMM, yyyy')
                      ) : (
                        'Invalid date'
                      )}

                      {/* {format(new Date(row.order_at), 'dd MMM, yyyy')} */}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="outline" className="text-muted-foreground px-1.5 w-fit">
                        {row.status === 'ordered' ? (
                          <IconCircleCheckFilled className="fill-green-500 dark:fill-blue-400 mr-1" />
                        ) : (
                          <IconLoader className="mr-1" />
                        )}
                        {row.status}
                      </Badge>
                      <p className="text-sm font-medium">Total Price: ₹{row.total_calculated_price}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium">Account Name</p>
                        <p>{row.customers.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Account Phone</p>
                        <p>{row.customers.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Account Email</p>
                        <p>{row.customers.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Buyer Name</p>
                        <p>{row.buyer_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Buyer Address</p>
                        <p>{row.buyer_address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Buyer Phone</p>
                        <p>{row.buyer_phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Buyer Email</p>
                        <p>{row.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Landmark</p>
                        <p>{row.landmark || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="font-medium">Item Count</p>
                        <p>{row.item_count || 'N/A'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="font-medium">Stores and Items</p>
                        {row.stores?.length ? (
                          row.stores.map((store) => (
                            <div key={store.store_id} className="mt-2">
                              <p className="font-semibold">
                                {store.business_name} - {store.phone || 'N/A'}
                              </p>
                              <ol className="list-decimal ml-6">
                                {store.items.map((item) => (
                                  <li key={`${row.order_id}-${item.product_id}`} className="mb-1">
                                    {item.product_name} (Qty: {item.quantity}, Price: ₹
                                    {item.discounted_price})
                                  </li>
                                ))}
                              </ol>
                            </div>
                          ))
                        ) : (
                          <p>No items available</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-center py-6">
              No results.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table view for large screens */}
      <div className="hidden md:block overflow-hidden rounded-lg border">
        <DndContext
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
          sensors={sensors}
          id={sortableId}
        >
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {table.getRowModel().rows?.length ? (
                <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                  {table.getRowModel().rows.map((row) => (
                    <DraggableRow key={row.id} row={row} />
                  ))}
                </SortableContext>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </div>

      {/* Pagination for both views */}
      <div className="flex items-center justify-between px-4 mt-3">
        <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="items-center gap-2 flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium hidden sm:flex">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 15, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}