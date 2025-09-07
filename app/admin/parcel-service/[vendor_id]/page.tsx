'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react';
import { columns } from '@/components/table/delivery-columns';
import { EnhancedDeliveryRecord } from '@/types/delivery-record';
import { balanceCalculation } from '@/lib/balanceCalculation';
import { format } from 'date-fns'

export default function DeliveryRecordsPage() {
  const [records, setRecords] = useState<EnhancedDeliveryRecord[]>([]);
  const [totalBalance, setTotalBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [cardPageIndex, setCardPageIndex] = useState(0);
  const [cardPageSize, setCardPageSize] = useState(10);

  const { vendor_id } = useParams();
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || '-';
  const phone = searchParams.get('phone') || '-';
  const business_name = searchParams.get('business_name') || '-';

  useEffect(() => {
    const fetchDeliveryRecords = async () => {
      if (!vendor_id) {
        setError('Vendor ID not found in route.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/parcel/getById?vendor_id=${vendor_id}`);
        const data = await response.json();
        console.log(data)
        if (!response.ok) {
          if (data.message === 'No delivery records found for this vendor_id') {
            setError('No delivery records found');
          } else {
            throw new Error(data.error || 'Failed to fetch delivery records');
          }
        } else {
          const enhancedRecords = balanceCalculation(data.deliveryRecords);
          setRecords(enhancedRecords);
          setTotalBalance(enhancedRecords.reduce((sum, record) => sum + record.calculatedTsb, 0));
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

  // Filter records for card view (no sorting, rely on backend)
  const filteredRecords = records.filter((record) =>
    Object.values(record).some((value) =>
      String(value || '').toLowerCase().includes(globalFilter.toLowerCase())
    )
  );

  const cardPageCount = Math.ceil(filteredRecords.length / cardPageSize);
  const paginatedRecords = filteredRecords.slice(
    cardPageIndex * cardPageSize,
    (cardPageIndex + 1) * cardPageSize
  );

  // Toggle card expansion
  const toggleCard = (order_id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(order_id)) {
        newSet.delete(order_id);
      } else {
        newSet.add(order_id);
      }
      return newSet;
    });
  };

  // Table setup for large screens (no sorting)
  const table = useReactTable({
    data: records,
    columns,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _columnId, filterValue) => {
      return Object.values(row.original).some((value) =>
        String(value || '').toLowerCase().includes(filterValue.toLowerCase())
      );
    },
    state: {
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <div className="w-full">
      <ScrollArea>
        <div className="h-[calc(100svh-5rem)] p-4">
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <Card className="mb-2 w-80">
              <CardContent className="flex flex-col gap-2">
                <CardTitle>Total Balance</CardTitle>
                <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalBalance.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="mb-2 w-full">
              <CardContent className="flex flex-col gap-2">
                <CardTitle className='text-green-500 border-b border-green-500/50 pb-1 max-w-50'>Vendor Details</CardTitle>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <CardDescription className="text-sm font-medium">Name</CardDescription>
                    <p className="lg:text-base">{name}</p>
                  </div>
                  <div>
                    <CardDescription className="text-sm font-medium">Phone</CardDescription>
                    <p className="lg:text-base">{phone}</p>
                  </div>
                  <div>
                    <CardDescription className="text-sm font-medium">Business Name</CardDescription>
                    <p className="lg:text-base">{business_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center py-4">
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm ml-1"
            />
            {/* Column visibility dropdown for table view */}
            <div className="hidden md:block ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
          {!loading && !error && (
            <>
              {/* Card view for small screens */}
              <div className="lg:hidden space-y-4">
                {paginatedRecords.length ? (
                  paginatedRecords.map((record) => {
                    const isExpanded = expandedCards.has(record.order_id);
                    return (
                      <Card key={record.order_id} className="w-full">
                        <CardHeader
                          className="flex flex-row items-center justify-between cursor-pointer px-4"
                          onClick={() => toggleCard(record.order_id)}
                        >
                          <div className="flex flex-col">
                            <CardTitle className="text-base">
                              {record.date ? format(new Date(record.date), 'dd MMM, yyyy') : '-'}
                            </CardTitle>
                            <p className="text-xs text-gray-500">{record.description}</p>
                          </div>
                          <div className="flex items-center gap-4 min-w-fit ">
                            <div className="text-right">
                              <p className="text-xs font-medium">TSB: ₹{record.calculatedTsb.toFixed(2)}</p>
                              <p className="text-xs font-medium">Balance: ₹{record.runningBalance.toFixed(2)}</p>
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
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs font-medium">Order ID</p>
                                <p className="text-xs">{record.order_id}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Mode</p>
                                <p className="text-xs">{record.mode || '-'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Product Bill</p>
                                <p className="text-xs">{record.productBill}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Delivery Amount</p>
                                <p className="text-xs">{record.dc_amt}</p>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Status</p>
                                <Badge variant={record.status === 'Delivered' ? 'default' : 'secondary'}>
                                  {record.status || '-'}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs font-medium">Notes</p>
                                <p className="text-xs">{record.note || '-'}</p>
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
              <div className="hidden lg:block">
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader className='bg-zinc-700/50'>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(header.column.columnDef.header, header.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} className="max-w-60 whitespace-normal break-words">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                              No results.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Pagination for both views */}
              <div className="flex items-center justify-between px-4 mt-3">
                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                  {filteredRecords.length} record(s) displayed.
                </div>
                <div className="flex w-full items-center gap-8 lg:w-fit">
                  <div className="items-center gap-2 flex">
                    <Label htmlFor="rows-per-page" className="text-sm font-medium hidden sm:flex">
                      Records per page
                    </Label>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(value) => {
                        table.setPageSize(Number(value));
                        setCardPageSize(Number(value));
                      }}
                    >
                      <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 15, 20, 30, 40, 50].map((size) => (
                          <SelectItem key={size} value={`${size}`}>
                            {size}
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
                      onClick={() => {
                        table.setPageIndex(0);
                        setCardPageIndex(0);
                      }}
                      disabled={!table.getCanPreviousPage() && cardPageIndex === 0}
                    >
                      <span className="sr-only">Go to first page</span>
                      <IconChevronsLeft />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => {
                        table.previousPage();
                        setCardPageIndex((prev) => prev - 1);
                      }}
                      disabled={!table.getCanPreviousPage() && cardPageIndex === 0}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <IconChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      className="size-8"
                      size="icon"
                      onClick={() => {
                        table.nextPage();
                        setCardPageIndex((prev) => prev + 1);
                      }}
                      disabled={!table.getCanNextPage() && cardPageIndex >= cardPageCount - 1}
                    >
                      <span className="sr-only">Go to next page</span>
                      <IconChevronRight />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden size-8 lg:flex"
                      size="icon"
                      onClick={() => {
                        table.setPageIndex(table.getPageCount() - 1);
                        setCardPageIndex(cardPageCount - 1);
                      }}
                      disabled={!table.getCanNextPage() && cardPageIndex >= cardPageCount - 1}
                    >
                      <span className="sr-only">Go to last page</span>
                      <IconChevronsRight />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}