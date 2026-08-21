const MAX_DIMENSION = 1200;
const QUALITY = 0.82;

// Resizes to a max 1200px long edge and re-encodes as WebP at quality 0.82,
// entirely in the browser, so a multi-MB phone photo never leaves the device
// at full size — this is what keeps Supabase's 1 GB free storage tier from filling up.
export async function compressImageToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed."))),
      "image/webp",
      QUALITY
    );
  });
}
