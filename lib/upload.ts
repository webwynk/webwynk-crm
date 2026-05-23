import { createSupabaseBrowserClient } from './supabase-browser';

/**
 * Uploads a file to a Supabase storage bucket
 * @param file The file to upload
 * @param bucket The name of the storage bucket
 * @param path The destination path inside the bucket (e.g. 'avatars/user-id.png')
 * @returns The public URL of the uploaded file
 */
export async function uploadFileToSupabase(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const supabase = createSupabaseBrowserClient();

  // Upload the file
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  if (!urlData || !urlData.publicUrl) {
    throw new Error('Failed to get public URL for uploaded file');
  }

  return urlData.publicUrl;
}
