'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown } from 'lucide-react';
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
import { Loader2 } from 'lucide-react';
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

const columns: ColumnDef<EnhancedDeliveryRecord>[] = [
    {
        accessorKey: 'date',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const date = row.getValue('date') as string | null;
            return <div>{date ? new Date(date).toLocaleDateString() : '-'}</div>;
        },
    },
    {
        accessorKey: 'order_id',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                Order ID
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div>{row.getValue('order_id')}</div>,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div>{row.getValue('description')}</div>,
    },
    {
        accessorKey: 'mode',
        header: 'Mode',
        cell: ({ row }) => <div>{row.getValue('mode') || '-'}</div>,
    },
    {
        accessorKey: 'productBill',
        header: 'Product Bill',
        cell: ({ row }) => <div>{row.getValue('productBill')}</div>,
    },
    {
        accessorKey: 'deliveryAmt',
        header: 'Delivery Amt',
        cell: ({ row }) => <div>{row.getValue('deliveryAmt')}</div>,
    },
    {
        accessorKey: 'calculatedTsb',
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            >
                TSB
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div>{row.getValue('calculatedTsb')}</div>,
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
            const status = row.getValue('status') as string | null;
            return (
                <Badge variant={status === 'Delivered' ? 'default' : 'secondary'}>
                    {status || '-'}
                </Badge>
            );
        },
    },
    {
        accessorKey: 'note',
        header: 'Notes',
        cell: ({ row }) => <div>{row.getValue('note') || '-'}</div>,
    },
];

export default function DeliveryRecordsPage() {
    const [records, setRecords] = useState<EnhancedDeliveryRecord[]>([]);
    const [totalBalance, setTotalBalance] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [globalFilter, setGlobalFilter] = useState('');

    const { vendor_id } = useParams();
    const searchParams = useSearchParams();
    const name = searchParams.get('name') || '-';
    const phone = searchParams.get('phone') || '-';
    const business_name = searchParams.get('business_name') || '-';

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
                setError('Vendor ID not found in route.');
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

    const table = useReactTable({
        data: records,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        globalFilterFn: (row, _columnId, filterValue) => {
            return Object.values(row.original).some((value) =>
                String(value || '').toLowerCase().includes(filterValue.toLowerCase())
            );
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
        },
    });

    return (
        <ScrollArea>
            <div className="w-[100vw] md:w-full h-[calc(100svh-4rem)]">
                <div className="mx-auto p-4">
                    <div className='flex gap-4 w-full'>
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
                                <CardTitle>Vendor Details</CardTitle>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <CardDescription className="text-sm font-medium">Name</CardDescription>
                                        <p className="text-lg">{name}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-sm font-medium">Phone</CardDescription>
                                        <p className="text-lg">{phone}</p>
                                    </div>
                                    <div>
                                        <CardDescription className="text-sm font-medium">Business Name</CardDescription>
                                        <p className="text-lg">{business_name}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                        <div className="w-full">
                            <div className="flex items-center py-4">
                                <Input
                                    placeholder="Search..."
                                    value={globalFilter}
                                    onChange={(event) => setGlobalFilter(event.target.value)}
                                    className="max-w-sm ml-1"
                                />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="ml-auto">
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
                            <div className="rounded-md border">
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
                                                        <TableCell key={cell.id}>
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
                            </div>
                            <div className="flex items-center justify-between px-4 mt-3">
                                <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                                    {table.getFilteredRowModel().rows.length} row(s) displayed.
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
                        </div>
                    )}
                </div>
            </div>
        </ScrollArea>
    );
}