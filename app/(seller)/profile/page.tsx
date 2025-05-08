'use client';

import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Pencil, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import RegisterStore from '@/components/register-store/register-store';
import CategoryDropdown from '@/components/register-store/category-dropdown';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppSelector';
import { setUser } from '@/lib/store/userSilce';
import { User } from '@/types/user';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { uploadProfilePic } from '@/lib/upload';

const categoryOptions = [
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

export default function SellerProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [personalFormData, setPersonalFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    whatsapp: '',
  });
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_address: '',
    business_type: '',
    product_service: '',
    business_experience: '',
    business_description: '',
    categories: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isPersonalDialogOpen, setIsPersonalDialogOpen] = useState(false);
  const [isBusinessDialogOpen, setIsBusinessDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [isPersonalSaving, setIsPersonalSaving] = useState(false);
  const [isBusinessSaving, setIsBusinessSaving] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string>('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    whatsapp: '',
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error('User ID not found in localStorage');
      }
      if (!user) {
        throw new Error('User not found in store');
      }
      setPersonalFormData({
        name: user.name || '',
        email: user.email || '',
        password: user.password || '',
        phone: user.phone || '',
        address: user.address || '',
        whatsapp: user.whatsapp?.replace('https://wa.me/', '') || '',
      });
      setBusinessFormData({
        business_name: user.business_name || '',
        business_address: user.business_address || '',
        business_type: user.business_type || '',
        product_service: user.product_service || '',
        business_experience: user.business_experience || '',
        business_description: user.business_description || '',
        categories: user.categories || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      toast.error('Failed to load user details', { position: 'top-right' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const validatePersonalForm = () => {
    const newErrors = {
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      whatsapp: '',
    };
    let isValid = true;

    // Name: Required
    if (!personalFormData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email: Valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (personalFormData.email && !emailRegex.test(personalFormData.email)) {
      newErrors.email = 'Invalid email address';
      isValid = false;
    }

    // Phone: Exactly 10 digits
    const phoneRegex = /^\d{10}$/;
    if (personalFormData.phone && !phoneRegex.test(personalFormData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      isValid = false;
    }

    // WhatsApp: Exactly 10 digits
    if (personalFormData.whatsapp && !phoneRegex.test(personalFormData.whatsapp)) {
      newErrors.whatsapp = 'WhatsApp number must be exactly 10 digits';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handlePersonalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Restrict phone and whatsapp to digits only
    if (name === 'phone' || name === 'whatsapp') {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setPersonalFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setPersonalFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Clear error on input change
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBusinessFormData((prev) => ({ ...prev, [name]: value || '' }));
  };

  const handleBusinessCategoryChange = (categories: string[]) => {
    setBusinessFormData((prev) => ({ ...prev, categories }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setPhotoError('Please select a valid image (JPEG, PNG, or GIF)');
        setPhotoFile(null);
      } else {
        setPhotoError('');
        setPhotoFile(file);
      }
    } else {
      setPhotoError('');
      setPhotoFile(null);
    }
  };

  const handleUpdatePersonal = async () => {
    if (!validatePersonalForm()) {
      return;
    }
    setIsPersonalSaving(true);
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error('User ID not found in localStorage');
      }

      const response = await fetch(`/api/user?user_id=${user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(personalFormData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update personal details');
      }
      dispatch(setUser(data.user));
      setPersonalFormData((prev) => ({ ...prev, password: '' }));
      toast.success('Personal details updated successfully', { position: 'top-right' });
      setIsPersonalDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update personal details', {
        position: 'top-right',
      });
    } finally {
      setIsPersonalSaving(false);
    }
  };

  const handleUpdateBusiness = async () => {
    setIsBusinessSaving(true);
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error('User ID not found in localStorage');
      }

      const response = await fetch(`/api/user?user_id=${user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessFormData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update business details');
      }
      dispatch(setUser(data.user));
      toast.success('Business details updated successfully', { position: 'top-right' });
      setIsBusinessDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update business details', {
        position: 'top-right',
      });
    } finally {
      setIsBusinessSaving(false);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!photoFile) {
      setPhotoError('Please select an image to upload');
      return;
    }
    setIsPhotoSaving(true);
    try {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) {
        throw new Error('User ID not found in localStorage');
      }

      // Upload new photo
      const publicUrl = await uploadProfilePic(photoFile, user_id, user?.photo || null);

      // Update user with new photo URL
      const response = await fetch(`/api/user?user_id=${user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: publicUrl }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile picture');
      }

      dispatch(setUser(data.user));
      toast.success('Profile picture updated successfully', { position: 'top-right' });
      setPhotoFile(null);
      setPhotoError('');
      setIsPhotoDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile picture', {
        position: 'top-right',
      });
    } finally {
      setIsPhotoSaving(false);
    }
  };

  const handleRegisterSuccess = (updatedUser: User) => {
    dispatch(setUser(updatedUser));
    setIsRegistering(false);
  };

  return (
    <ScrollArea>
      <div className="w-full h-[calc(100svh-4rem)]">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">User Profile</h2>
            {user && (
              <Dialog open={isPersonalDialogOpen} onOpenChange={setIsPersonalDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Personal Information</DialogTitle>
                  </DialogHeader>
                  <ScrollArea>
                    <div className="grid gap-4 max-h-[75svh] mr-3">
                      <div className="grid gap-3">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={personalFormData.name}
                          onChange={handlePersonalInputChange}
                        />
                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={personalFormData.email}
                          onChange={handlePersonalInputChange}
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                      </div>
                      <div className="relative grid gap-3">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          value={personalFormData.password}
                          onChange={handlePersonalInputChange}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-2 top-8.5 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={personalFormData.phone}
                          onChange={handlePersonalInputChange}
                          placeholder="Enter 10-digit phone number"
                        />
                        {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address"
                          name="address"
                          value={personalFormData.address}
                          onChange={handlePersonalInputChange}
                        />
                        {errors.address && <p className="text-red-500 text-sm">{errors.address}</p>}
                      </div>
                      <div className="grid gap-3">
                        <Label htmlFor="whatsapp">WhatsApp</Label>
                        <Input
                          id="whatsapp"
                          name="whatsapp"
                          type="tel"
                          value={personalFormData.whatsapp}
                          onChange={handlePersonalInputChange}
                          placeholder="Enter 10-digit WhatsApp number"
                        />
                        {errors.whatsapp && <p className="text-red-500 text-sm">{errors.whatsapp}</p>}
                      </div>
                    </div>
                  </ScrollArea>
                  <Button
                    onClick={handleUpdatePersonal}
                    className="text-white w-fit ml-auto"
                    disabled={isPersonalSaving}
                  >
                    {isPersonalSaving ? 'Saving...' : 'Save Personal Info'}
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {loading && <CardDescription>Loading user profile...</CardDescription>}
          {error && <CardDescription className="text-red-500">{error}</CardDescription>}
          {!loading && !error && !user && (
            <CardDescription>No user profile found.</CardDescription>
          )}

          {!loading && !error && user && (
            <>
              <Card className="w-full">
                <CardHeader>
                  <div className="flex flex-row gap-4 items-center">
                    <div className='relative'>
                      <img
                        src={user.photo ? user.photo : './user.png'}
                        alt="user_pic"
                        className="w-20 h-20 rounded-md object-cover"
                      />
                      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
                        <DialogTrigger asChild>
                          <div onClick={() => setIsPhotoDialogOpen(true)}>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button className='absolute -bottom-2 -right-2 rounded-full bg-gray-100/50 backdrop-blur-xs p-2 border-2 border-blue-600/70 text-blue-600'>
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className='text-white'>
                                  <p>Update Profile Pic</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Update Profile Picture</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <div className="grid gap-3">
                              <Label htmlFor="photo">Select Image</Label>
                              <Input
                                id="photo"
                                type="file"
                                accept="image/jpeg,image/png,image/gif"
                                onChange={handlePhotoChange}
                              />
                              {photoError && <p className="text-red-500 text-sm">{photoError}</p>}
                            </div>
                            <Button
                              onClick={handleUpdatePhoto}
                              className="text-white w-fit ml-auto"
                              disabled={isPhotoSaving}
                            >
                              {isPhotoSaving ? 'Uploading...' : 'Save'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">{user.name || 'N/A'}</CardTitle>
                      <CardDescription className="font-semibold">
                        Vendor ID: {user.vendor_id || 'N/A'}
                      </CardDescription>
                      <p className="text-sm text-yellow-500">
                        {'★'.repeat(Math.floor(Number(user.rating) || 0)).padEnd(5, '☆')} {Number(user.rating || 0).toFixed(1)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm">{user.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm">{user.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Address</p>
                        <p className="text-sm">{user.address || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">WhatsApp</p>
                        <p className="text-sm">{user.whatsapp || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Store Register</p>
                        <p className="text-sm">{user.is_registered ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {user.is_registered && (
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Business Information</h3>
                      <Dialog open={isBusinessDialogOpen} onOpenChange={setIsBusinessDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex items-center gap-2">
                            <Pencil className="h-4 w-4" /> Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Business Information</DialogTitle>
                          </DialogHeader>
                          <ScrollArea>
                            <div className="grid gap-4 max-h-[75svh] mr-4">
                              <div className="grid gap-3">
                                <Label htmlFor="business_name">Business Name</Label>
                                <Input
                                  id="business_name"
                                  name="business_name"
                                  value={businessFormData.business_name}
                                  onChange={handleBusinessInputChange}
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="business_address">Business Address</Label>
                                <Input
                                  id="business_address"
                                  name="business_address"
                                  value={businessFormData.business_address}
                                  onChange={handleBusinessInputChange}
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="business_type">Business Type</Label>
                                <Input
                                  id="business_type"
                                  name="business_type"
                                  value={businessFormData.business_type}
                                  onChange={handleBusinessInputChange}
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="product_service">Product/Service</Label>
                                <Input
                                  id="product_service"
                                  name="product_service"
                                  value={businessFormData.product_service}
                                  onChange={handleBusinessInputChange}
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="business_experience">Business Experience</Label>
                                <Input
                                  id="business_experience"
                                  name="business_experience"
                                  value={businessFormData.business_experience}
                                  onChange={handleBusinessInputChange}
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="categories">Categories</Label>
                                <CategoryDropdown
                                  options={categoryOptions}
                                  selected={businessFormData.categories}
                                  onChange={handleBusinessCategoryChange}
                                />
                              </div>
                              <div className="grid gap-3">
                                <Label htmlFor="business_description">Business Description</Label>
                                <textarea
                                  id="business_description"
                                  name="business_description"
                                  value={businessFormData.business_description}
                                  onChange={handleBusinessInputChange}
                                  className="w-full h-24 p-2 border rounded-md dark:bg-accent dark:border-input"
                                />
                              </div>
                            </div>
                          </ScrollArea>
                          <Button
                            onClick={handleUpdateBusiness}
                            className="text-white w-fit ml-auto"
                            disabled={isBusinessSaving}
                          >
                            {isBusinessSaving ? 'Saving...' : 'Save Business Info'}
                          </Button>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div>
                        <CardDescription className="text-sm font-medium">Store Status</CardDescription>
                        <p className={`text-sm font-semibold ${user.is_business_owner ? 'text-green-500' : 'text-red-400'}`}>
                          {user.is_business_owner ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Business Name</CardDescription>
                        <p className="text-sm">{user.business_name || 'N/A'}</p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Business Address</CardDescription>
                        <p className="text-sm">{user.business_address || 'N/A'}</p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Business Type</CardDescription>
                        <p className="text-sm">{user.business_type || 'N/A'}</p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Product/Service</CardDescription>
                        <p className="text-sm">{user.product_service || 'N/A'}</p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Business Experience</CardDescription>
                        <p className="text-sm">{user.business_experience || 'N/A'}</p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Business Description</CardDescription>
                        <p className="text-sm">{user.business_description || 'N/A'}</p>
                      </div>
                      <div>
                        <CardDescription className="text-sm font-medium">Categories</CardDescription>
                        <p className="text-sm">{user.categories?.join(', ') || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {!user?.is_registered && (
                <>
                  {isRegistering ? (
                    <RegisterStore
                      user_id={user.user_id}
                      onRegisterSuccess={handleRegisterSuccess}
                      onCancel={() => setIsRegistering(false)}
                    />
                  ) : (
                    <Button
                      onClick={() => setIsRegistering(true)}
                      className="text-white w-fit"
                    >
                      Register a Store
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex justify-center w-full">
              <img
                src={photoFile ? URL.createObjectURL(photoFile) : user?.photo || './user.png'}
                alt="Profile preview"
                className="w-50 h-60 rounded-md object-cover"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="photo">Select Image</Label>
              <Input
                id="photo"
                type="file"
                accept="image/jpeg,image/png,image/gif"
                onChange={handlePhotoChange}
              />
              {photoError && <p className="text-red-500 text-sm">{photoError}</p>}
            </div>
            <Button
              onClick={handleUpdatePhoto}
              className="text-white w-fit ml-auto"
              disabled={isPhotoSaving}
            >
              {isPhotoSaving ? 'Uploading...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </ScrollArea>
  );
}