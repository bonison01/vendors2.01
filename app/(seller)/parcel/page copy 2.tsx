'use client';

import React, { useEffect, useState } from 'react';
import { useAppSelector } from "@/hooks/useAppSelector";
import {
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format, addDays, startOfMonth, subMonths, startOfWeek } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';

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
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<string>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  const vendor_id = useAppSelector((state) => state.user.user?.vendor_id);

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
          const enhancedRecords = balanceCalculation(data.deliveryRecords);
          setRecords(enhancedRecords);
          // sum of TSB from DB
          // setTotalBalance(enhancedRecords.reduce((sum, record) => sum + (record.tsb || 0), 0));
          
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

  // Filter records for card view and export
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

  // Table setup for large screens
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

  // Handle export
  const handleExport = () => {
    let start: Date;
    let end: Date = addDays(new Date(), 1);

    switch (selectedRange) {
      case 'today':
        start = new Date();
        end = addDays(new Date(), 1);
        break;
      case 'thisWeek':
        start = startOfWeek(new Date(), { weekStartsOn: 1 });
        break;
      case 'thisMonth':
        start = startOfMonth(new Date());
        break;
      case 'last3Months':
        start = subMonths(new Date(), 3);
        break;
      case 'last6Months':
        start = subMonths(new Date(), 6);
        break;
      case 'oneYear':
        start = subMonths(new Date(), 12);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) {
          alert('Please select both start and end dates for custom range.');
          return;
        }
        start = new Date(customStartDate);
        end = addDays(new Date(customEndDate), 1);
        if (start > end) {
          alert('Start date cannot be after end date.');
          return;
        }
        break;
      default:
        start = startOfMonth(new Date());
    }

    const filteredByDate = filteredRecords.filter((record) => {
      if (!record.date) return false;
      const recordDate = new Date(record.date);
      return recordDate >= start && recordDate < end;
    });

    if (filteredByDate.length === 0) {
      alert('No records found for the selected date range.');
      return;
    }

    const exportData = filteredByDate.map((record) => ({
      date: record.date || '-',
      order_id: record.order_id,
      name: record.name || '-',
      address: record.address || '-',
      mobile: record.mobile || '-',
      mode: record.mode || '-',
      pb: record.pb || '-',
      dc: record.dc || '-',
      pb_amt: record.pb_amt || '-',
      dc_amt: record.dc_amt || '-',
      tsb: record.tsb || '-',
      cid: record.cid || '-',
      status: record.status || '-',
      note: record.note || '-',
      vendor_id: record.vendor_id || '-',
      runningBalance: record.runningBalance,


    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delivery Records');
    XLSX.writeFile(workbook, `Delivery_Records_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    setIsExportDialogOpen(false);
  };

  return (
    <div className="w-full">
      <ScrollArea>
        <div className="h-[calc(100svh-5rem)] p-4">
          {/* Balance card */}
          <div className="flex gap-4 mb-4">
            <Card className="w-80">
              <CardContent className="flex flex-col gap-2">
                <CardTitle>Total Balance</CardTitle>
                <p className={`text-3xl font-bold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{totalBalance.toFixed(2)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search, Export, Column Toggle */}
          <div className="flex items-center gap-4 py-4">
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm ml-1"
            />

            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Export to Excel</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Delivery Records</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col space-y-4">
                  <div className='grid gap-3'>
                    <Label htmlFor="dateRange">Select Date Range</Label>
                    <Select
                      value={selectedRange}
                      onValueChange={(value) => {
                        setSelectedRange(value);
                        if (value !== 'custom') {
                          setCustomStartDate('');
                          setCustomEndDate('');
                        }
                      }}
                    >
                      <SelectTrigger id="dateRange">
                        <SelectValue placeholder="Select range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="thisWeek">This Week</SelectItem>
                        <SelectItem value="thisMonth">This Month</SelectItem>
                        <SelectItem value="last3Months">Last 3 Months</SelectItem>
                        <SelectItem value="last6Months">Last 6 Months</SelectItem>
                        <SelectItem value="oneYear">One Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedRange === 'custom' && (
                    <div className="space-y-4">
                      <div className='grid gap-3'>
                        <Label htmlFor="customStartDate">Start Date</Label>
                        <Input
                          type="date"
                          id="customStartDate"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                        />
                      </div>
                      <div className='grid gap-3'>
                        <Label htmlFor="customEndDate">End Date</Label>
                        <Input
                          type="date"
                          id="customEndDate"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  <Button onClick={handleExport} className='text-white ml-auto'>Export</Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="hidden md:block ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table.getAllColumns().filter((c) => c.getCanHide()).map((column) => (
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

          {/* Loading / Error */}
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

          {/* Card + Table views */}
          {!loading && !error && (
            <>
              {/* Mobile cards */}
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
                          </div>
                          <div className="flex items-center gap-4 min-w-fit ">
                            <div className="text-right">
                              {/* <p className="text-xs font-medium">TSB: ₹{record.tsb.toFixed(2)}</p> */}
                              <p className="text-xs font-medium">
  TSB: ₹{(record.calculatedTsb ?? 0).toFixed(2)}
</p>

                              <p className="text-xs font-medium">Balance: ₹{record.runningBalance.toFixed(2)}</p>
                            </div>
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
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
                                <p className="text-xs">{record.pb_amt}</p>
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
                    <CardContent className="text-center py-6">No results.</CardContent>
                  </Card>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden lg:block">
                <Card>
                  <CardContent>
                    <Table>
                      <TableHeader>
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

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 mt-3">
                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                  {filteredRecords.length} record(s) found.
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
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => {
                        table.setPageIndex(0);
                        setCardPageIndex(0);
                      }}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to first page</span>
                      <IconChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        table.previousPage();
                        setCardPageIndex((prev) => Math.max(prev - 1, 0));
                      }}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <IconChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => {
                        table.nextPage();
                        setCardPageIndex((prev) => Math.min(prev + 1, cardPageCount - 1));
                      }}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to next page</span>
                      <IconChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => {
                        table.setPageIndex(table.getPageCount() - 1);
                        setCardPageIndex(cardPageCount - 1);
                      }}
                      disabled={!table.getCanNextPage()}
                    >
                      <span className="sr-only">Go to last page</span>
                      <IconChevronsRight className="h-4 w-4" />
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
