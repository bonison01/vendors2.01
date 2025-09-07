import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedDeliveryRecord } from '@/types/delivery-record';
import { format } from 'date-fns';

export const columns: ColumnDef<EnhancedDeliveryRecord>[] = [
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
      return <div>{date ? format(new Date(date), 'dd MMM, yyyy') : '-'}</div>;
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
    id: 'description',
    header: 'Description',
    cell: ({ row }) => {
      const name = row.original.name || '-';
      const address = row.original.address || '-';
      const mobile = row.original.mobile || '-';

      return (
        <div className="space-y-1">
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{address}</div>
          <div className="text-sm text-gray-500">{mobile}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'mode',
    header: 'Mode',
    cell: ({ row }) => <div>{row.getValue('mode') || '-'}</div>,
  },
  {
    accessorKey: 'pb_amt',
    header: 'Product Bill',
    cell: ({ row }) => {
      const value = row.getValue('pb_amt') as number | null;
      return <div>₹{value?.toFixed(2) ?? '-'}</div>;
    },
  },
  {
    accessorKey: 'dc_amt',
    header: 'Delivery Amt',
    cell: ({ row }) => {
      const value = row.getValue('dc_amt') as number | null;
      return <div>₹{value?.toFixed(2) ?? '-'}</div>;
    },
  },
  {
    accessorKey: 'calculatedTsb',
    header: 'TSB',
    cell: ({ row }) => {
      const value = row.getValue('calculatedTsb') as number | null;
      return <div>₹{value?.toFixed(2) ?? '-'}</div>;
    },
  },
  {
    accessorKey: 'runningBalance',
    header: 'Balance',
    cell: ({ row }) => {
      const value = row.getValue('runningBalance') as number | null;
      return <div>₹{value?.toFixed(2) ?? '-'}</div>;
    },
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
