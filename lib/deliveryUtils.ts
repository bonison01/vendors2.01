import { z } from 'zod';
import { format } from 'date-fns';
import jsPDF from 'jspdf';

// Zod schema for validation
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

export const mapOrderToSchema = (order: any): z.infer<typeof schema> => {
  return schema.parse(order);
};

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

export const generateReceiptPDF = (order: z.infer<typeof schema>) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(0, 128, 0);
  doc.rect(0, y - 10, pageWidth, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('Mateng - Delivery Receipt', pageWidth / 2, y, { align: 'center' });
  y += 15;

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
  const pickupAddress = doc.splitTextToSize(`Address: ${order.pickup_address}`, 140);
  pickupAddress.forEach((line: string) => {
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
  const dropoffAddress = doc.splitTextToSize(`Address: ${order.dropoff_address}`, 140);
  dropoffAddress.forEach((line: string) => {
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

  doc.setFillColor(220, 220, 220);
  doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('Details', 25, y);
  doc.text('Value', pageWidth - 50, y);
  y += 10;

  // Charge
  doc.setFont('helvetica', 'normal');
  doc.text('Delivery Charge:', 25, y);
  doc.text(`₹${order.charge ? order.charge.toFixed(2) : 'N/A'}`, pageWidth - 50, y);
  y += 10;

  // Distance
  doc.text('Distance:', 25, y);
  doc.text(`${order.distance ? `${order.distance.toFixed(2)} km` : 'N/A'}`, pageWidth - 50, y);
  y += 10;

  // Customer Details
  if (order.customers) {
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details -', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.customers.name || 'N/A'}`, 24, y);
    y += 8;
    doc.text(`Phone: ${order.customers.phone || 'N/A'}`, 24, y);
    y += 8;
    doc.text(`Email: ${order.customers.email || 'N/A'}`, 24, y);
    y += 10;
  }

  // Business Details
  if (order.users) {
    doc.setFont('helvetica', 'bold');
    doc.text('Business Details -', 20, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${order.users.business_name || 'N/A'}`, 24, y);
    y += 8;
    doc.text(`Phone: ${order.users.phone || 'N/A'}`, 24, y);
    y += 10;
  }

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated via Mateng Platform', pageWidth / 2, 285, { align: 'center' });

  // Save PDF
  doc.save(`SB-${order.id}-receipt.pdf`);
};
