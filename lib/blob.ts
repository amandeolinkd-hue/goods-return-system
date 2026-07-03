import { put } from "@vercel/blob";

/**
 * Uploads a file to Vercel Blob and returns its public URL.
 * Returns null (and warns) if no BLOB token is configured — so local dev
 * without a Blob token still works, just without attachments.
 */
export async function uploadAttachment(
  file: File,
  keyPrefix: string
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.warn("BLOB_READ_WRITE_TOKEN not set — attachment not uploaded.");
    return null;
  }
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const blob = await put(`${keyPrefix}/${Date.now()}-${safeName}`, file, {
    access: "public",
  });
  return blob.url;
}
