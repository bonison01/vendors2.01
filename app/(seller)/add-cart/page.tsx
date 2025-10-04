"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const categories = ["Food", "Craft", "Music", "Art", "Games", "Event", "Other", "Business"];

export default function AddPlacePage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [features, setFeatures] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Load user_id from localStorage (should be from public.users)
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setUserId(storedUserId);
    } else {
      console.warn("User ID not found in localStorage.");
    }
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `place-${Date.now()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from("places-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from("places-images")
      .getPublicUrl(filePath);

    return publicUrlData?.publicUrl ?? null;
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert("❌ User not logged in.");
      return;
    }

    setUploading(true);
    setSuccessMessage("");

    let imageUrl = "";

    if (imageFile) {
      const uploadedUrl = await uploadImage(imageFile);
      if (!uploadedUrl) {
        alert("❌ Image upload failed.");
        setUploading(false);
        return;
      }
      imageUrl = uploadedUrl;
    }

    const parsedPrice = parseFloat(price);
    const validPrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : null;

    const featuresArray = features
      .split(",")
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const { error } = await supabase.from("places").insert([
      {
        user_id: userId, // ✅ references public.users(user_id)
        name: name || null,
        type: type || null,
        opening_hours: openingHours || null,
        image_url: imageUrl,
        description: description || null,
        contact: contact || null,
        start_date: type === "Event" ? startDate || null : null,
        end_date: type === "Event" ? endDate || null : null,
        price: type === "Event" ? validPrice : null,
        location: location || null,
        features: featuresArray.length > 0 ? featuresArray : null,
      },
    ]);

    setUploading(false);

    if (error) {
      console.error("Insert error:", error);
      alert("❌ Failed to add place: " + error.message);
    } else {
      setSuccessMessage("✅ Place added successfully!");
      // Reset form
      setName("");
      setType("");
      setOpeningHours("");
      setDescription("");
      setContact("");
      setStartDate("");
      setEndDate("");
      setPrice("");
      setLocation("");
      setFeatures("");
      setImageFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pt-20">
      <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6">➕ Add New Place</h1>

        <label className="block mb-1">Place Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Sunset Cafe" className="mb-4" />

        <label className="block mb-1">Category</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded mb-4"
        >
          <option value="">-- Select Type --</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <label className="block mb-1">Opening Hours</label>
        <Input
          value={openingHours}
          onChange={(e) => setOpeningHours(e.target.value)}
          placeholder="e.g., 10:00 AM - 9:00 PM"
          className="mb-4"
        />

        <label className="block mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the place"
          className="w-full p-2 mb-4 bg-gray-700 rounded text-white resize-none"
          rows={3}
        />

        <label className="block mb-1">Contact</label>
        <Input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Phone or email"
          className="mb-4"
        />

        {type === "Event" && (
          <>
            <label className="block mb-1">Start Date</label>
            <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" className="mb-4" />

            <label className="block mb-1">End Date</label>
            <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" className="mb-4" />

            <label className="block mb-1">Price (₹)</label>
            <Input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g., 499.99"
              className="mb-4"
            />
          </>
        )}

        <label className="block mb-1">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Address or area"
          className="mb-4"
        />

        <label className="block mb-1">Features (comma separated)</label>
        <Input
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder="e.g., Wifi, Parking, Pet Friendly"
          className="mb-6"
        />

        <label className="block mb-1">Image</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="mb-6"
        />

        <Button onClick={handleSubmit} disabled={uploading} className="w-full">
          {uploading ? "Saving..." : "Save Place"}
        </Button>

        {successMessage && <p className="text-green-400 mt-4">{successMessage}</p>}
      </div>
    </div>
  );
}
