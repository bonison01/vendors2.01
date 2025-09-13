'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from "@/hooks/useAppSelector";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import Dialog from './Dailog';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type FormData = {
    business_name: string;
    business_address: string;
    primary_contact: string;
    opening_hours: string;
    product_service: string;
    unique_product_service: string;
    product_photo: File | null;
    experience_in_field: string;
    pickup_location_1: string;
    pickup_location_2: string;
    pickup_location_3: string;
    google_map_link: string;
    account_holder_name: string;
    account_number: string;
    ifsc: string;
    bank_name: string;
    upi_qr_photo: File | null;
    account_type: string;
    accepted_terms: boolean;
};

const initialFormData: FormData = {
    business_name: '',
    business_address: '',
    primary_contact: '',
    opening_hours: '',
    product_service: '',
    unique_product_service: '',
    product_photo: null,
    experience_in_field: '',
    pickup_location_1: '',
    pickup_location_2: '',
    pickup_location_3: '',
    google_map_link: '',
    account_holder_name: '',
    account_number: '',
    ifsc: '',
    bank_name: '',
    upi_qr_photo: null,
    account_type: '',
    accepted_terms: false,
};

export default function VendorFormPage() {
    const router = useRouter();
    const vendor_id = useAppSelector((state) => state.user.user?.vendor_id);
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [showBankDetails, setShowBankDetails] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, files } = e.target;
        if (files && files[0]) {
            const file = files[0];
            const isValid = isValidFileType(file);
            if (!isValid) {
                setError(`Invalid file type for ${id === 'product_photo' ? 'product photo' : 'UPI QR code photo'}. Only JPEG/PNG allowed.`);
                setFormData(prev => ({ ...prev, [id]: null }));
            } else {
                setError(null);
                setFormData(prev => ({ ...prev, [id]: file }));
            }
        }
    };

    const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { checked } = e.target;
        setFormData(prev => ({ ...prev, accepted_terms: checked }));
    };

    const uploadFile = async (file: File, path: string): Promise<string> => {
        const { error: uploadError } = await supabase
            .storage
            .from('vendor-photos')
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError.message);
            throw uploadError;
        }

        const { data: urlData } = supabase
            .storage
            .from('vendor-photos')
            .getPublicUrl(path);

        if (!urlData || !urlData.publicUrl) {
            throw new Error('Failed to get public URL after upload.');
        }

        return urlData.publicUrl;
    };

    const isValidFileType = (file: File) => ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!vendor_id) {
            setError('Vendor ID not found. Please log in.');
            return;
        }

        if (!formData.accepted_terms) {
            setError('You must agree to the terms and conditions to proceed.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            let productPhotoUrl = '';
            let upiQrPhotoUrl = '';

            const fileUploads = [];

            if (formData.product_photo) {
                if (!isValidFileType(formData.product_photo)) {
                    throw new Error('Invalid file type for product photo. Only JPEG/PNG allowed.');
                }
                const file = formData.product_photo;
                const ext = file.name.split('.').pop();
                const path = `product_photos/${vendor_id}/product_photo_${Date.now()}.${ext}`;
                const uploadPromise = uploadFile(file, path).then((url) => {
                    productPhotoUrl = url;
                    console.log('Product photo uploaded successfully. Public URL:', url);
                });
                fileUploads.push(uploadPromise);
            }

            if (formData.upi_qr_photo) {
                if (!isValidFileType(formData.upi_qr_photo)) {
                    throw new Error('Invalid file type for UPI QR code photo. Only JPEG/PNG allowed.');
                }
                const file = formData.upi_qr_photo;
                const ext = file.name.split('.').pop();
                const path = `upi_qr/${vendor_id}/upi_qr_${Date.now()}.${ext}`;
                const uploadPromise = uploadFile(file, path).then((url) => {
                    upiQrPhotoUrl = url;
                    console.log('UPI QR photo uploaded successfully. Public URL:', url);
                });
                fileUploads.push(uploadPromise);
            }

            await Promise.all(fileUploads);

            const payload = {
                vendor_id,
                business_name: formData.business_name,
                business_address: formData.business_address,
                primary_contact: formData.primary_contact,
                opening_hours: formData.opening_hours,
                product_service: formData.product_service,
                unique_product_service: formData.unique_product_service,
                product_photo_video: productPhotoUrl, // Matches backend key
                experience_in_field: formData.experience_in_field,
                pickup_location_1: formData.pickup_location_1,
                pickup_location_2: formData.pickup_location_2,
                pickup_location_3: formData.pickup_location_3,
                google_map_link: formData.google_map_link,
                account_holder_name: formData.account_holder_name,
                account_number: formData.account_number,
                ifsc: formData.ifsc,
                bank_name: formData.bank_name,
                upi_qr: upiQrPhotoUrl, // Matches backend key
                account_type: formData.account_type,
            };

            console.log('Payload being sent to the database:', payload);

            const response = await fetch('/api/vendor/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save business details.');
            }

            alert('Business details saved successfully!');
            router.push('/parcel');
        } catch (err: any) {
            console.error('Upload or Submit Error', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen p-4 bg-zinc-950 text-white">
            <Card className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl text-center text-zinc-200">Your Business Profile</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500 text-white p-3 rounded-md text-center">
                                {error}
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <Button
                                type="button"
                                onClick={() => setShowBankDetails(false)}
                                className={`w-full transition-colors ${!showBankDetails ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                Business Information
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setShowBankDetails(true)}
                                className={`w-full transition-colors ${showBankDetails ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'}`}>
                                Bank Details
                            </Button>
                        </div>

                        {!showBankDetails && (
                            <>
                                <h3 className="text-lg font-semibold text-zinc-200">Business Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="business_name" className="text-zinc-400">Business Name</Label>
                                        <Input id="business_name" type="text" value={formData.business_name} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <Label htmlFor="primary_contact" className="text-zinc-400">Primary Contact</Label>
                                        <Input id="primary_contact" type="tel" value={formData.primary_contact} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="business_address" className="text-zinc-400">Business Address</Label>
                                        <Input id="business_address" type="text" value={formData.business_address} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <Label htmlFor="opening_hours" className="text-zinc-400">Opening Hours</Label>
                                        <Input id="opening_hours" type="text" value={formData.opening_hours} onChange={handleChange} placeholder="e.g., Mon-Sat, 9AM - 7PM" className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="google_map_link" className="text-zinc-400">Google Map Link (Main Pickup Point)</Label>
                                        <Input id="google_map_link" type="url" value={formData.google_map_link} onChange={handleChange} className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="product_service" className="text-zinc-400">Product/Service Offered</Label>
                                    <Textarea id="product_service" value={formData.product_service} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="unique_product_service" className="text-zinc-400">Unique Product or Service</Label>
                                    <Textarea id="unique_product_service" value={formData.unique_product_service} onChange={handleChange} className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </>
                        )}

                        {showBankDetails && (
                            <>
                                <h3 className="text-lg font-semibold text-zinc-200">Bank Details</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="account_holder_name" className="text-zinc-400">Account Holder Name</Label>
                                        <Input id="account_holder_name" type="text" value={formData.account_holder_name} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <Label htmlFor="bank_name" className="text-zinc-400">Bank Name</Label>
                                        <Input id="bank_name" type="text" value={formData.bank_name} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <Label htmlFor="account_number" className="text-zinc-400">Account Number</Label>
                                        <Input id="account_number" type="text" value={formData.account_number} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <Label htmlFor="ifsc" className="text-zinc-400">IFSC Code</Label>
                                        <Input id="ifsc" type="text" value={formData.ifsc} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <Label htmlFor="account_type" className="text-zinc-400">Account Type</Label>
                                        <Input id="account_type" type="text" value={formData.account_type} onChange={handleChange} required className="bg-zinc-800 border-zinc-700 text-white focus:ring-blue-500 focus:border-blue-500" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Label htmlFor="upi_qr_photo" className="text-zinc-400">UPI QR Code Photo</Label>
                                        <Input id="upi_qr_photo" type="file" onChange={handleFileChange} className="text-zinc-400 file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-4 file:py-2 hover:file:bg-blue-700 file:transition-colors" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex items-center space-x-2">
                            <input
                                id="accepted_terms"
                                type="checkbox"
                                checked={formData.accepted_terms}
                                onChange={handleTermsChange}
                                required
                                className="form-checkbox h-4 w-4 text-blue-600 bg-zinc-800 border-zinc-700 rounded focus:ring-offset-zinc-900"
                            />
                            <Label htmlFor="accepted_terms" className="text-zinc-400">I agree to the <a href="#" onClick={() => setIsDialogOpen(true)} className="text-blue-500 hover:underline">Terms and Conditions</a></Label>
                        </div>

                        <div className="mt-4">
                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors" disabled={isLoading}>
                                {isLoading ? <Loader2 className="animate-spin" /> : 'Save Details'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
        </div>
    );
}