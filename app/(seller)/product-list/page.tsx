'use client';

import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
import { uploadMedia } from '@/lib/uploadMedia';
import { Trash2 } from 'lucide-react';

interface Product {
  id: number;
  user_id: string;
  name: string;
  description: string | null;
  price_inr: number;
  media_urls: string[];
  category: string | null;
  user_name: string | null;
  discount_rate: number;
  discounted_price: number;
  quantity: number | null;
  unit: string | null;
  unit_quantity: string | null;
  updated_at: string | null;
}

interface MediaItem {
  url?: string;
  file?: File;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [editAlertOpen, setEditAlertOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const userId = localStorage.getItem('user_id');
      if (!userId) {
        setError('Please log in to view products');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/products/getAllProductById?user_id=${userId}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch products');
        }
        // Sort products by updated_at (latest first)
        const sortedProducts = data.products.sort((a: Product, b: Product) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
        setProducts(sortedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditForm({
      name: product.name,
      description: product.description,
      price_inr: product.price_inr,
      discount_rate: product.discount_rate,
      quantity: product.quantity,
      category: product.category,
      unit: product.unit,
      unit_quantity: product.unit_quantity,
    });
    setMediaItems(product.media_urls.map(url => ({ url })));
    setEditOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteAlertOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedProduct) return;

    try {
      // Upload all new files
      const uploadedUrls = await Promise.all(
        mediaItems.map(async (item) => {
          if (item.file) {
            if (!['image/jpeg', 'image/png', 'video/mp4', 'video/webm'].includes(item.file.type)) {
              throw new Error('Only JPEG, PNG, MP4, or WEBM files are allowed');
            }
            if (item.file.size > 3 * 1024 * 1024) {
              throw new Error('File size must be less than 3MB');
            }
            return await uploadMedia(item.file, selectedProduct.user_id);
          }
          return item.url;
        })
      );

      const response = await fetch('/api/products/updateProduct', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
          user_id: selectedProduct.user_id,
          name: editForm.name,
          description: editForm.description,
          price_inr: editForm.price_inr ? Number(editForm.price_inr) : undefined,
          media_urls: uploadedUrls.filter((url): url is string => url !== undefined),
          category: editForm.category,
          discount_rate: editForm.discount_rate ? Number(editForm.discount_rate) : undefined,
          quantity: editForm.quantity,
          unit: editForm.unit,
          unit_quantity: editForm.unit_quantity,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product');
      }

      setProducts((prev) =>
        prev.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, ...editForm, media_urls: uploadedUrls.filter((url): url is string => url !== undefined) }
            : p
        ).sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        })
      );
      setEditOpen(false);
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update product');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedProduct) return;

    try {
      const response = await fetch('/api/products/deleteProduct', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedProduct.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id));
      setDeleteAlertOpen(false);
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete product');
    }
  };

  // Group products by category
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Others';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  // Define the order of categories (as per your categoryList)
  const categoryOrder = [
    'Grocery',
    'Instant Foods',
    'Snacks',
    'Soft Drinks And Juices',
    'Books',
    'Electronics',
    'Personal Hygiene And Health',
    'Books & Stationary',
    'Fashion',
    'Service',
    'Others',
  ];

  // Sort categories according to categoryOrder
  const sortedCategories = Object.keys(groupedProducts).sort((a, b) => {
    const indexA = categoryOrder.indexOf(a);
    const indexB = categoryOrder.indexOf(b);
    // If category is not in categoryOrder, push it to the end
    return (indexA === -1 ? Infinity : indexA) - (indexB === -1 ? Infinity : indexB);
  });

  if (loading) {
    return (
      <ScrollArea>
        <div className="w-full h-[calc(100svh-4rem)] p-6">Loading...</div>
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <ScrollArea>
        <div className="w-full h-[calc(100svh-4rem)] p-6 text-red-500">{error}</div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea>
      <div className="w-full h-[calc(100svh-4rem)] p-4 md:p-6">
        <h2 className="text-2xl font-semibold mb-4">My Products</h2>
        {sortedCategories.length === 0 ? (
          <p>No products found.</p>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h3 className="text-xl font-semibold mb-3 pb-1 border-b">{category}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedProducts[category].map((product) => (
                    <Card key={product.id} className="flex flex-col p-2 gap-2">
                      <CardContent className="flex-1 p-0 relative">
                        {product.media_urls.length > 0 ? (
                          <div className="relative w-full h-64">
                            <Image
                              src={product.media_urls[0]}
                              alt={product.name}
                              fill
                              className="object-cover rounded-md"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-md">
                            <span className="text-gray-500">No Image</span>
                          </div>
                        )}
                        <div className="flex flex-row justify-between items-top my-2">
                          <div className="flex flex-col leading-none w-3/4">
                            <CardTitle className="text-base text-white">{product.name}</CardTitle>
                          </div>
                          <span className="w-fit text-xs text-blue-100 font-semibold bg-blue-300/30 mb-auto py-1.5 px-3 rounded-full leading-none">
                            {product.unit_quantity || 'n/a'}{" "}{product.unit || ''}
                          </span>
                        </div>
                        <div className="flex flex-col items-start font-semibold mb-2">
                          <CardDescription className="line-through text-[10px] sm:text-xs">MRP: ₹{product.price_inr}</CardDescription>
                          <CardDescription className="text-gray-200 text-xs sm:text-sm">Discount Price: ₹{product.discounted_price}</CardDescription>
                        </div>

                        <Button variant="destructive" onClick={() => handleDelete(product)} className='absolute top-2 right-2 dark:bg-red-600/70'>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 px-2">
                        <Button variant="outline" onClick={() => handleDetails(product)}>
                          Details
                        </Button>
                        <Button className="text-white" onClick={() => handleEdit(product)}>
                          Edit
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Product Details</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Name:</Label>
                  <span className="col-span-3">{selectedProduct?.name}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Description:</Label>
                  <span className="col-span-3">{selectedProduct.description || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Price (INR):</Label>
                  <span className="col-span-3">₹{selectedProduct.price_inr}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Discount Rate:</Label>
                  <span className="col-span-3">{selectedProduct.discount_rate}%</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Discounted Price:</Label>
                  <span className="col-span-3">₹{selectedProduct.discounted_price}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Quantity:</Label>
                  <span className="col-span-3">{selectedProduct.quantity || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Category:</Label>
                  <span className="col-span-3">{selectedProduct.category || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Unit:</Label>
                  <span className="col-span-3">{selectedProduct.unit || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Unit Quantity:</Label>
                  <span className="col-span-3">{selectedProduct.unit_quantity || 'N/A'}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="col-span-1 font-medium">Updated At:</Label>
                  <span className="col-span-3">
                    {selectedProduct.updated_at
                      ? new Date(selectedProduct.updated_at).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="col-span-1 font-medium">Images:</Label>
                  <div className="col-span-3">
                    {selectedProduct.media_urls.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedProduct.media_urls.map((url, index) => (
                          <div key={index} className="relative w-full h-24">
                            {url.match(/\.(mp4|webm)$/i) ? (
                              <video
                                src={url}
                                controls
                                className="w-full h-24 object-cover rounded-md"
                              />
                            ) : (
                              <Image
                                src={url}
                                alt={`${selectedProduct.name} image ${index + 1}`}
                                fill
                                className="object-cover rounded-md"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
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
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="col-span-1 font-medium">
                    Description:
                  </Label>
                  <Input
                    id="description"
                    className="col-span-3"
                    value={editForm.description || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value || null })
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
                    value={editForm.price_inr ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, price_inr: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discount_rate" className="col-span-1 font-medium">
                    Discount Rate:
                  </Label>
                  <Input
                    id="discount_rate"
                    type="number"
                    step="0.01"
                    className="col-span-3"
                    value={editForm.discount_rate ?? ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, discount_rate: e.target.value ? Number(e.target.value) : undefined })
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
                    value={editForm.quantity ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
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
                    value={editForm.category || 'None'}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, category: value === 'None' ? null : value })
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
                    value={editForm.unit || 'None'}
                    onValueChange={(value) =>
                      setEditForm({ ...editForm, unit: value === 'None' ? null : value })
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
                    value={editForm.unit_quantity ?? ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
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
                                fill
                                className="object-cover rounded-md"
                                sizes="64px"
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
                                fill
                                className="object-cover rounded-md"
                                sizes="64px"
                              />
                            )
                          ) : null}
                        </div>
                        <Input
                          type="file"
                          accept="image/jpeg,image/png,video/mp4,video/webm"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const newMediaItems = [...mediaItems];
                            newMediaItems[index] = { ...newMediaItems[index], file };
                            setMediaItems(newMediaItems);
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
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setEditAlertOpen(true)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Product</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSubmit} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={editAlertOpen} onOpenChange={setEditAlertOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Product Update</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to save these changes to the product? This will update the product details.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEditSubmit}>Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}