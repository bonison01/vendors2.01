import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedDeliveryRecord } from '@/types/delivery-record';
import { format } from 'date-fns'

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
    header: 'TSB',
    cell: ({ row }) => <div>{row.getValue('calculatedTsb')}</div>,
  },
  {
    accessorKey: 'runningBalance',
    header: 'Balance',
    cell: ({ row }) => <div>₹{(row.getValue('runningBalance') as number).toFixed(2)}</div>,
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