/**
 * Converts various Google Drive URL formats to a direct image URL.
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * 
 * Returns original URL if not a Google Drive link.
 */
export function getDirectImageUrl(url: string): string {
  if (!url) return url;

  // Match /file/d/FILE_ID
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }

  // Match open?id=FILE_ID or uc?id=FILE_ID
  const idMatch = url.match(/drive\.google\.com\/(?:open|uc)\?.*id=([a-zA-Z0-9_-]+)/);
  if (idMatch) {
    return `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
  }

  return url;
}
