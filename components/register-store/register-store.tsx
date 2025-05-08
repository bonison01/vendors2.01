'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import CategoryDropdown from './category-dropdown';

interface RegisterFormData {
  business_name: string;
  business_address: string;
  business_type: string;
  product_service: string;
  business_experience: string;
  business_description: string;
  categories: string[];
  phone: string;
  whatsapp: string;
}

interface RegisterStoreProps {
  user_id: string;
  onRegisterSuccess: (updatedUser: any) => void;
  onCancel: () => void;
}

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

export default function RegisterStore({ user_id, onRegisterSuccess, onCancel }: RegisterStoreProps) {
  const [registerFormData, setRegisterFormData] = useState<RegisterFormData>({
    business_name: '',
    business_address: '',
    business_type: '',
    product_service: '',
    business_experience: '',
    business_description: '',
    categories: [],
    phone: '',
    whatsapp: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({
    business_name: '',
    business_address: '',
    business_type: '',
    product_service: '',
    phone: '',
    whatsapp: '',
  });

  const validateForm = () => {
    const newErrors = {
      business_name: '',
      business_address: '',
      business_type: '',
      product_service: '',
      phone: '',
      whatsapp: '',
    };
    let isValid = true;

    // Required fields
    if (!registerFormData.business_name.trim()) {
      newErrors.business_name = 'Business name is required';
      isValid = false;
    }
    if (!registerFormData.business_address.trim()) {
      newErrors.business_address = 'Business address is required';
      isValid = false;
    }
    if (!registerFormData.business_type.trim()) {
      newErrors.business_type = 'Business type is required';
      isValid = false;
    }
    if (!registerFormData.product_service.trim()) {
      newErrors.product_service = 'Product/Service is required';
      isValid = false;
    }

    // Phone: 10 digits if provided
    const phoneRegex = /^\d{10}$/;
    if (registerFormData.phone && !phoneRegex.test(registerFormData.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      isValid = false;
    }

    // WhatsApp: 10 digits if provided
    if (registerFormData.whatsapp && !phoneRegex.test(registerFormData.whatsapp)) {
      newErrors.whatsapp = 'WhatsApp number must be exactly 10 digits';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegisterInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Restrict phone and whatsapp to digits only
    if (name === 'phone' || name === 'whatsapp') {
      if (/^\d*$/.test(value) && value.length <= 10) {
        setRegisterFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setRegisterFormData((prev) => ({ ...prev, [name]: value || '' }));
    }
    // Clear error on input change
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCategoryChange = (categories: string[]) => {
    setRegisterFormData((prev) => ({ ...prev, categories }));
  };

  const handleRegisterStore = async () => {
    if (!validateForm()) {
      return;
    }
    const confirmed = window.confirm('Are you sure you want to register your store?');
    if (!confirmed) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/user?user_id=${user_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_registered: true,
          business_name: registerFormData.business_name || null,
          business_address: registerFormData.business_address || null,
          business_type: registerFormData.business_type || null,
          product_service: registerFormData.product_service || null,
          business_experience: registerFormData.business_experience || null,
          business_description: registerFormData.business_description || null,
          categories: registerFormData.categories.length > 0 ? registerFormData.categories : null,
          phone: registerFormData.phone || null,
          whatsapp: registerFormData.whatsapp || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to register store');
      }
      setRegisterFormData({
        business_name: '',
        business_address: '',
        business_type: '',
        product_service: '',
        business_experience: '',
        business_description: '',
        categories: [],
        phone: '',
        whatsapp: '',
      });
      toast.success('Store registered successfully', { position: 'top-right' });
      onRegisterSuccess(data.user);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to register store', {
        position: 'top-right',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Store Registration</CardTitle>
        <CardDescription>Please fill the form details correctly.</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-3">
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                value={registerFormData.business_name}
                onChange={handleRegisterInputChange}
              />
              {errors.business_name && <p className="text-red-500 text-sm">{errors.business_name}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="business_address">Business Address</Label>
              <Input
                id="business_address"
                name="business_address"
                value={registerFormData.business_address}
                onChange={handleRegisterInputChange}
              />
              {errors.business_address && <p className="text-red-500 text-sm">{errors.business_address}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="business_type">Business Type</Label>
              <Input
                id="business_type"
                name="business_type"
                value={registerFormData.business_type}
                onChange={handleRegisterInputChange}
              />
              {errors.business_type && <p className="text-red-500 text-sm">{errors.business_type}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="product_service">Product/Service</Label>
              <Input
                id="product_service"
                name="product_service"
                value={registerFormData.product_service}
                onChange={handleRegisterInputChange}
              />
              {errors.product_service && <p className="text-red-500 text-sm">{errors.product_service}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={registerFormData.phone}
                onChange={handleRegisterInputChange}
                placeholder="Enter 10-digit phone number"
              />
              {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                type="tel"
                value={registerFormData.whatsapp}
                onChange={handleRegisterInputChange}
                placeholder="Enter 10-digit WhatsApp number"
              />
              {errors.whatsapp && <p className="text-red-500 text-sm">{errors.whatsapp}</p>}
            </div>
            <div className="grid gap-3">
              <Label htmlFor="business_experience">Business Experience</Label>
              <Input
                id="business_experience"
                name="business_experience"
                value={registerFormData.business_experience}
                onChange={handleRegisterInputChange}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="categories">Categories</Label>
              <CategoryDropdown
                options={categoryOptions}
                selected={registerFormData.categories}
                onChange={handleCategoryChange}
              />
            </div>
            <div className="md:col-span-2 grid gap-3">
              <Label htmlFor="business_description">Business Description</Label>
              <textarea
                id="business_description"
                name="business_description"
                value={registerFormData.business_description}
                onChange={handleRegisterInputChange}
                className="w-full h-24 p-2 border rounded-md dark:bg-accent dark:border-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onCancel} disabled={isSaving}>
              Cancel Registration
            </Button>
            <Button onClick={handleRegisterStore} className="text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Register'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}