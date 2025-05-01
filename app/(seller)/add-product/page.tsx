'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Image from 'next/image';
import { Trash2 } from 'lucide-react';
import { uploadMedia } from '@/lib/uploadMedia';
import imageCompression from 'browser-image-compression';
import * as XLSX from 'xlsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductForm {
  name: string;
  description: string | null;
  price_inr: number | undefined;
  media_urls?: string[];
  category: string | null;
  discounted_price: number | undefined;
  quantity: number | null;
  unit: string | null;
  unit_quantity: string | null;
}

interface BulkProduct {
  user_id: string;
  name: string;
  description: string | null;
  price_inr: number;
  category: string | null;
  discounted_price: number;
  quantity: number | null;
  unit: string | null;
  unit_quantity: string | null;
}

interface MediaItem {
  url?: string;
  file?: File;
}

export default function AddProductPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: null,
    price_inr: undefined,
    category: null,
    discounted_price: undefined,
    quantity: null,
    unit: null,
    unit_quantity: null,
  });
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const compressImage = async (file: File): Promise<File> => {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    const options = {
      maxSizeMB: 3,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('Failed to compress image');
    }
  };

  const handleAddSubmit = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Please log in to add a product');
      return;
    }

    try {
      const uploadedUrls = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.file) {
            if (!['image/jpeg', 'image/png', 'video/mp4', 'video/webm'].includes(item.file.type)) {
              throw new Error('Only JPEG, PNG, MP4, or WEBM files are allowed');
            }
            const fileToUpload = await compressImage(item.file);
            if (fileToUpload.size > 3 * 1024 * 1024) {
              throw new Error('File size must be less than 3MB after compression');
            }
            return await uploadMedia(fileToUpload, userId);
          }
          return item.url;
        })
      );

      const response = await fetch('/api/products/addProduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: form.name,
          description: form.description,
          price_inr: form.price_inr ? Number(form.price_inr) : undefined,
          media_urls: uploadedUrls.filter((url): url is string => url !== undefined),
          category: form.category,
          discount_rate: 0,
          discounted_price: form.discounted_price ? Number(form.discounted_price) : undefined,
          quantity: form.quantity,
          unit: form.unit,
          unit_quantity: form.unit_quantity,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add product');
      }

      setAddOpen(false);
      setForm({
        name: '',
        description: null,
        price_inr: undefined,
        category: null,
        discounted_price: undefined,
        quantity: null,
        unit: null,
        unit_quantity: null,
      });
      setMediaItems([]);
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add product');
    }
  };

  const downloadSampleExcel = () => {
    const sampleData = [
      {
        name: 'Sample Product',
        description: 'Sample description',
        price_inr: 100,
        category: 'Grocery',
        discounted_price: 80,
        quantity: 10,
        unit: 'kg',
        unit_quantity: '1',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');
    XLSX.writeFile(workbook, 'sample_products.xlsx');
  };

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Please log in to upload products');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        const parsedProducts: BulkProduct[] = jsonData.map((row) => ({
          user_id: userId, // Add user_id from localStorage
          name: String(row.name || ''),
          description: row.description ? String(row.description) : null,
          price_inr: Number(row.price_inr) || 0,
          category: row.category ? String(row.category) : null,
          discounted_price: Number(row.discounted_price) || 0,
          quantity: row.quantity ? Number(row.quantity) : null,
          unit: row.unit ? String(row.unit) : null,
          unit_quantity: row.unit_quantity ? String(row.unit_quantity) : null,
        }));

        // Basic validation
        if (parsedProducts.some((p) => !p.name || p.price_inr <= 0 || p.discounted_price <= 0)) {
          toast.error('All products must have a name, positive price, and positive discounted price');
          return;
        }

        setBulkProducts(parsedProducts);
        toast.success('Excel file loaded successfully');
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast.error('Failed to read Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkUpload = async () => {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      toast.error('Please log in to upload products');
      return;
    }

    if (bulkProducts.length === 0) {
      toast.error('No products to upload');
      return;
    }

    try {
      const response = await fetch('/api/products/bulkAddProducts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          bulkProducts.map((product) => ({
            ...product,
            discount_rate: 0,
          }))
        ),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload products');
      }

      setBulkProducts([]);
      toast.success('Products uploaded successfully');
    } catch (error) {
      console.error('Error uploading bulk products:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload products');
    }
  };

  return (
    <ScrollArea>
      <div className="w-full h-[calc(100svh-4rem)]">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 md:px-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">Add New Product</h2>
            <div className="flex gap-2">
              <Button className='text-white' onClick={downloadSampleExcel}>Download Sample Excel</Button>
              <Button className='text-white' asChild>
                <label>
                  Upload Excel
                  <Input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleExcelUpload}
                  />
                </label>
              </Button>
              <Button className='text-white' onClick={() => setAddOpen(true)}>Add Product</Button>
            </div>
          </div>

          {bulkProducts.length > 0 && (
            <div className="mt-4">
              <h3 className="text-xl font-semibold mb-2">Preview Products</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Price (INR)</TableHead>
                    <TableHead>Discounted Price (INR)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.description || '-'}</TableCell>
                      <TableCell>{product.price_inr}</TableCell>
                      <TableCell>{product.discounted_price}</TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.quantity || '-'}</TableCell>
                      <TableCell>{product.unit || '-'}</TableCell>
                      <TableCell>{product.unit_quantity || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button className="mt-4" onClick={() => setBulkConfirmOpen(true)}>
                Upload All Products
              </Button>
            </div>
          )}
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
            </DialogHeader>
            <ScrollArea>
              <div className="grid gap-4 py-4 h-[70svh] mr-3">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="col-span-1 font-medium">
                    Name:
                  </Label>
                  <Input
                    id="name"
                    className="col-span-3"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="col-span-1 font-medium">
                    Description:
                  </Label>
                  <Input
                    id="description"
                    className="col-span-3"
                    value={form.description || ''}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value || null })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price_inr" className="col-span-1 font-medium">
                    Price (INR):
                  </Label>
                  <Input
                    id="price_inr"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={form.price_inr ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, price_inr: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discounted_price" className="col-span-1 font-medium">
                    Discounted Price (INR):
                  </Label>
                  <Input
                    id="discounted_price"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={form.discounted_price ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, discounted_price: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quantity" className="col-span-1 font-medium">
                    Quantity:
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    className="col-span-3"
                    value={form.quantity ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        quantity: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="col-span-1 font-medium">
                    Category:
                  </Label>
                  <Select
                    value={form.category || 'None'}
                    onValueChange={(value) =>
                      setForm({ ...form, category: value === 'None' ? null : value })
                    }
                  >
                    <SelectTrigger className="col-span-3 w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Grocery">Grocery</SelectItem>
                      <SelectItem value="Instant Foods">Instant Foods</SelectItem>
                      <SelectItem value="Snacks">Snacks</SelectItem>
                      <SelectItem value="Soft Drinks And Juices">Soft Drinks And Juices</SelectItem>
                      <SelectItem value="Books">Books</SelectItem>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Personal Hygiene And Health">Personal Hygiene And Health</SelectItem>
                      <SelectItem value="Books & Stationary">Books & Stationary</SelectItem>
                      <SelectItem value="Fashion">Fashion</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                      <SelectItem value="Others">Others</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit" className="col-span-1 font-medium">
                    Unit:
                  </Label>
                  <Select
                    value={form.unit || 'None'}
                    onValueChange={(value) =>
                      setForm({ ...form, unit: value === 'None' ? null : value })
                    }
                  >
                    <SelectTrigger className="col-span-3 w-full">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">None</SelectItem>
                      <SelectItem value="mg">mg</SelectItem>
                      <SelectItem value="gm">gm</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="ltr">ltr</SelectItem>
                      <SelectItem value="piece">piece</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                      <SelectItem value="box">box</SelectItem>
                      <SelectItem value="bottle">bottle</SelectItem>
                      <SelectItem value="dozen">dozen</SelectItem>
                      <SelectItem value="pair">pair</SelectItem>
                      <SelectItem value="set">set</SelectItem>
                      <SelectItem value="sheet">sheet</SelectItem>
                      <SelectItem value="roll">roll</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit_quantity" className="col-span-1 font-medium">
                    Unit Quantity:
                  </Label>
                  <Input
                    id="unit_quantity"
                    type="text"
                    className="col-span-3"
                    value={form.unit_quantity ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unit_quantity: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="col-span-1 font-medium">Media:</Label>
                  <div className="col-span-3 space-y-2">
                    {mediaItems.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="relative w-16 h-16">
                          {item.file ? (
                            item.file.type.startsWith('video/') ? (
                              <video
                                src={URL.createObjectURL(item.file)}
                                className="w-16 h-16 object-cover rounded-md"
                                controls
                              />
                            ) : (
                              <Image
                                src={URL.createObjectURL(item.file)}
                                alt={`Product media ${index + 1}`}
                                width={64}
                                height={64}
                                className="object-cover rounded-md"
                              />
                            )
                          ) : item.url ? (
                            item.url.match(/\.(mp4|webm)$/i) ? (
                              <video
                                src={item.url}
                                className="w-16 h-16 object-cover rounded-md"
                                controls
                              />
                            ) : (
                              <Image
                                src={item.url}
                                alt={`Product media ${index + 1}`}
                                width={64}
                                height={64}
                                className="object-cover rounded-md"
                              />
                            )
                          ) : null}
                        </div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,video/mp4,video/webm"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const compressedFile = await compressImage(file);
                              if (compressedFile.size > 3 * 1024 * 1024) {
                                toast.error('File size must be less than 3MB after compression');
                                return;
                              }
                              const newMediaItems = [...mediaItems];
                              newMediaItems[index] = { ...newMediaItems[index], file: compressedFile };
                              setMediaItems(newMediaItems);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : 'Failed to process image');
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setMediaItems(mediaItems.filter((_, i) => i !== index));
                          }}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMediaItems([...mediaItems, {}])}
                    >
                      Add Image
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setConfirmOpen(true)}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Product Addition</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to add this product? Please review the details before confirming.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleAddSubmit}>Add</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bulk Product Upload</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to upload {bulkProducts.length} products? Please review the table before confirming.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleBulkUpload}>Upload</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}