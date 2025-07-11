// Optimized image processor
import { IMAGE_CACHE_TTL } from '../utils/helpers';

class ImageProcessor {
    static async processBase64Image(base64Data, filename) {
        try {
            // Validate base64 data
            if (!base64Data || base64Data.length < 10) {
                throw new Error('Invalid image data');
            }

            // Use more efficient base64 decoding
            const binary = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

            // Determine content type
            let contentType = 'image/jpeg';
            if (filename.match(/\.png$/i)) contentType = 'image/png';
            else if (filename.match(/\.gif$/i)) contentType = 'image/gif';
            else if (filename.match(/\.webp$/i)) contentType = 'image/webp';

            return { binary, contentType };
        } catch (error) {
            throw new Error('Failed to process image: ' + error.message);
        }
    }
}

export { ImageProcessor };