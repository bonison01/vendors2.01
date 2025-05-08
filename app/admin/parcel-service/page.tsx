'use client';

import React, { useState, useEffect } from 'react';
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
import { columns } from '@/components/table/column';
import { User } from '@/types/user';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/getAllUser');
        const data = await response.json();

        if (!response.ok) {
          if (data.message === 'No users found') {
            setError('No users found');
          } else {
            throw new Error(data.error || 'Failed to fetch users');
          }
        } else {
          setUsers(data.users);
          setError(null);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const table = useReactTable({
    data: users,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      return Object.values(row.original).some((value) =>
        String(value || '').toLowerCase().includes(String(filterValue || '').toLowerCase())
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
      pagination,
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

  // Card view pagination
  const filteredRows = table.getFilteredRowModel().rows.map((row) => row.original);
  const paginatedRows = filteredRows.slice(
    table.getState().pagination.pageIndex * table.getState().pagination.pageSize,
    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize
  );

  return (
    <ScrollArea className="h-[calc(100svh-4rem)]">
      <div className="mx-auto p-4">
        <Card className="gap-0">
          <CardHeader>
            <CardTitle className="text-lg">Vendor List</CardTitle>
          </CardHeader>
          <CardContent className='px-2 sm:px-6'>
            {loading && ( 
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            )}
            {error && (
              <div className="text-red-500 text-center p-4">{error}</div>
            )}
            {!loading && !error && (
              <div className="w-full">
                <div className="flex gap-4 items-center py-4">
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
                            onCheckedChange={(value) =>
                              column.toggleVisibility(!!value)
                            }
                          >
                            {column.id}
                          </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Card view for small screens */}
                <div className="md:hidden space-y-4">
                  {paginatedRows.length ? (
                    paginatedRows.map((row) => {
                      const isExpanded = expandedCards.has(row.user_id);
                      return (
                        <Card key={row.user_id} className="w-full">
                          <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer"
                            onClick={() => toggleCard(row.user_id)}
                          >
                            <div className="flex flex-col">
                              <CardTitle className="text-base">{row.business_name}</CardTitle>
                              <CardDescription className="font-medium">{row.vendor_id}</CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                              {isExpanded ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </div>
                          </CardHeader>
                          {isExpanded && (
                            <CardContent>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <CardDescription className="font-medium">Name</CardDescription>
                                  <p>{row.name || 'N/A'}</p>
                                </div>
                                <div>
                                  <CardDescription className="font-medium">Phone</CardDescription>
                                  <p>{row.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <CardDescription className="font-medium">Email</CardDescription>
                                  <p>{row.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <CardDescription className="font-medium">Category</CardDescription>
                                  <p>{row.categories || 'N/A'}</p>
                                </div>
                                <div>
                                  <CardDescription className="font-medium">Store</CardDescription>
                                  <p>{row.is_business_owner !== null && row.is_business_owner !== undefined ? (row.is_business_owner ? "True" : "False") : "N/A"}</p>

                                </div>
                                <div className='flex flex-row justify-center gap-3 col-span-2 mt-2'>
                                  <Button className='text-white bg-blue-400'
                                    onClick={() => {
                                      if (row.vendor_id) {
                                        const query = new URLSearchParams({
                                          name: row.name || '',
                                          phone: row.phone || '',
                                          business_name: row.business_name || '',
                                        }).toString();
                                        router.push(`/admin/parcel-service/${row.vendor_id}?${query}`);
                                      } else {
                                        alert('Vendor ID not available for this user');
                                      }
                                    }}
                                  >Transaction</Button>
                                  <Button variant='outline'>View</Button>
                                  <Button variant='outline'>Edit</Button>
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
                <div className="hidden md:block">
                  <Table>
                    <TableHeader className='bg-zinc-700/50'>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <TableHead key={header.id}>
                              {header.isPlaceholder
                                ? null
                                : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            </TableHead>
                          ))}
                        </TableRow>
                      ))}
                    </TableHeader>
                    <TableBody>
                      {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                          <TableRow
                            key={row.id}
                            data-state={row.getIsSelected() && 'selected'}
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell key={cell.id}>
                                {flexRender(
                                  cell.column.columnDef.cell,
                                  cell.getContext()
                                )}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={columns.length}
                            className="h-24 text-center"
                          >
                            No results.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination for both views */}
                <div className="flex items-center justify-between px-4 mt-3">
                  <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
                    {table.getFilteredSelectedRowModel().rows.length} of{' '}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
                  </div>
                  <div className="flex w-full items-center gap-8 lg:w-fit">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="rows-per-page"
                        className="hidden text-sm font-medium sm:flex"
                      >
                        Rows per page
                      </Label>
                      <Select
                        value={`${table.getState().pagination.pageSize}`}
                        onValueChange={(value) =>
                          table.setPageSize(Number(value))
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-20"
                          id="rows-per-page"
                        >
                          <SelectValue
                            placeholder={table.getState().pagination.pageSize}
                          />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 30, 40, 50].map((pageSize) => (
                            <SelectItem
                              key={pageSize}
                              value={`${pageSize}`}
                            >
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-fit items-center justify-center text-sm font-medium">
                      Page {table.getState().pagination.pageIndex + 1} of{' '}
                      {table.getPageCount()}
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
                        onClick={() =>
                          table.setPageIndex(table.getPageCount() - 1)
                        }
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
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}