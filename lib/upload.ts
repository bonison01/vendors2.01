import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadProfilePic(file: File, userId: string, existingPhotoUrl: string | null): Promise<string> {
  if (!userId) {
    throw new Error('User ID is required for media upload');
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
  }

  // Validate file size (3MB = 3,000,000 bytes)
  const maxSize = 3 * 1000 * 1000;
  if (file.size > maxSize) {
    throw new Error('File size exceeds 3MB limit.');
  }

  // Generate file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  // Delete existing photo if it exists
  if (existingPhotoUrl) {
    const existingFilePath = existingPhotoUrl.split('/').slice(-1)[0];
    if (existingFilePath) {
      const { error: deleteError } = await supabase.storage
        .from('profile-pic')
        .remove([existingFilePath]);
      if (deleteError) {
        console.error('Failed to delete existing photo:', deleteError.message);
        // Continue with upload
      }
    }
  }

  // Upload new file
  const { error: uploadError } = await supabase.storage
    .from('profile-pic')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // Get public URL
  const { data } = supabase.storage
    .from('profile-pic')
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Failed to get public URL');
  }

  return data.publicUrl;
}