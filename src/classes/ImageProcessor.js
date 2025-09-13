// Advanced image processor with optimization capabilities
import { IMAGE_CACHE_TTL } from '../utils/helpers';

// Size variant configurations
const SIZE_VARIANTS = {
    thumbnail: { width: 300, height: 300, quality: 75 },
    medium: { width: 800, height: 800, quality: 85 },
    full: { quality: 90 }
};

// Enhanced format support detection with browser compatibility
function selectOptimalFormat(acceptHeader = '', userAgent = '') {
    const ua = userAgent.toLowerCase();
    
    // Check for AVIF support (modern browsers, exclude Safari < 16.1)
    if (acceptHeader.includes('image/avif')) {
        // Safari 16.1+ supports AVIF
        if (ua.includes('safari') && !ua.includes('chrome')) {
            const safariMatch = ua.match(/version\/(\d+)\.(\d+)/);
            if (safariMatch && (parseInt(safariMatch[1]) > 16 || 
                (parseInt(safariMatch[1]) === 16 && parseInt(safariMatch[2]) >= 1))) {
                return 'avif';
            }
        } else if (!ua.includes('safari')) {
            // Chrome, Firefox, Edge all support AVIF
            return 'avif';
        }
    }
    
    // Check for WebP support (95% of browsers)
    if (acceptHeader.includes('image/webp')) {
        return 'webp';
    }
    
    // Fallback to JPEG for universal compatibility
    return 'jpeg';
}

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

    // Generate blur placeholder (1KB)
    static generateBlurPlaceholder(base64Data) {
        try {
            // Create a tiny 32x32 blur placeholder
            // This is a simplified version - in production, you'd use Canvas API
            const shortBase64 = base64Data.substring(0, 200);
            return `data:image/jpeg;base64,${shortBase64}`;
        } catch (error) {
            console.warn('Failed to generate blur placeholder:', error);
            // Return a minimal 1x1 transparent pixel as fallback
            return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }
    }

    // Process image for specific variant and format
    static async processImageVariant(base64Data, variant = 'full', format = 'jpeg', filename = '') {
        try {
            if (!SIZE_VARIANTS[variant]) {
                throw new Error(`Unknown variant: ${variant}`);
            }

            // Convert base64 to binary
            const { binary } = await this.processBase64Image(base64Data, filename);
            
            // Determine optimal format
            let outputFormat = format;
            if (format === 'auto') {
                outputFormat = 'webp'; // Default to WebP for auto
            }

            // Use ImageOptimizer for real processing
            const optimized = await ImageOptimizer.optimizeForVariant(binary, variant, outputFormat, filename);
            
            return {
                binary: optimized.buffer,
                contentType: optimized.contentType,
                variant: optimized.variant,
                format: optimized.format,
                originalSize: optimized.originalSize,
                compressedSize: optimized.optimizedSize,
                compressionRatio: optimized.compressionRatio,
                fallback: optimized.fallback
            };
        } catch (error) {
            throw new Error(`Failed to process ${variant} variant: ${error.message}`);
        }
    }

    // Get cache key for image variant
    static getCacheKey(propref, variant, format, photoIndex = 1) {
        return `img_${propref}_${variant}_${format}_${photoIndex}`;
    }

    // Get appropriate cache TTL based on variant
    static getCacheTTL(variant) {
        const ttlMap = {
            thumbnail: 24 * 3600,  // 1 day
            medium: 12 * 3600,     // 12 hours  
            full: 6 * 3600,        // 6 hours
            placeholder: 7 * 24 * 3600  // 1 week
        };
        return ttlMap[variant] || IMAGE_CACHE_TTL;
    }
}

// Advanced ImageOptimizer class for format conversion and resizing
class ImageOptimizer {
    static async convertToWebP(imageBuffer, quality = 85, width = null, height = null) {
        try {
            // Create blob from buffer
            const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
            
            // Create image bitmap from blob
            const imageBitmap = await createImageBitmap(blob);
            
            // Determine dimensions
            const targetWidth = width || imageBitmap.width;
            const targetHeight = height || imageBitmap.height;
            
            // Create canvas and context
            const canvas = new OffscreenCanvas(targetWidth, targetHeight);
            const ctx = canvas.getContext('2d');
            
            // Draw and resize image
            ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
            
            // Convert to WebP
            const webpBlob = await canvas.convertToBlob({
                type: 'image/webp',
                quality: quality / 100
            });
            
            // Verify the blob is actually WebP by checking the MIME type
            console.log('WebP conversion - Blob type:', webpBlob.type, 'Size:', webpBlob.size);
            
            const webpBuffer = await webpBlob.arrayBuffer();
            const webpArray = new Uint8Array(webpBuffer);
            
            // Check WebP magic bytes (RIFF + WEBP)
            const isWebP = webpArray.length > 12 && 
                          webpArray[0] === 0x52 && webpArray[1] === 0x49 && // 'RI'
                          webpArray[2] === 0x46 && webpArray[3] === 0x46 && // 'FF' 
                          webpArray[8] === 0x57 && webpArray[9] === 0x45 && // 'WE'
                          webpArray[10] === 0x42 && webpArray[11] === 0x50; // 'BP'
            
            console.log('WebP magic bytes check:', isWebP, 'First 16 bytes:', Array.from(webpArray.slice(0, 16)).map(b => b.toString(16).padStart(2, '0')).join(' '));
            
            if (!isWebP) {
                console.warn('Canvas convertToBlob returned non-WebP data, falling back to JPEG');
                throw new Error('WebP conversion failed - invalid format returned');
            }
            
            return {
                buffer: webpArray,
                contentType: 'image/webp',
                quality: quality,
                compressionRatio: webpBuffer.byteLength / imageBuffer.length,
                originalSize: imageBuffer.length,
                compressedSize: webpBuffer.byteLength
            };
        } catch (error) {
            console.error('WebP conversion failed:', error);
            // Fallback to original
            return {
                buffer: imageBuffer,
                contentType: 'image/jpeg',
                quality: quality,
                compressionRatio: 1,
                originalSize: imageBuffer.length,
                compressedSize: imageBuffer.length,
                fallback: true
            };
        }
    }
    
    static async convertToAVIF(imageBuffer, quality = 75, width = null, height = null) {
        try {
            // Create blob from buffer
            const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
            
            // Create image bitmap from blob
            const imageBitmap = await createImageBitmap(blob);
            
            // Determine dimensions
            const targetWidth = width || imageBitmap.width;
            const targetHeight = height || imageBitmap.height;
            
            // Create canvas and context
            const canvas = new OffscreenCanvas(targetWidth, targetHeight);
            const ctx = canvas.getContext('2d');
            
            // Draw and resize image
            ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
            
            // Convert to AVIF (note: AVIF support varies by browser/runtime)
            const avifBlob = await canvas.convertToBlob({
                type: 'image/avif',
                quality: quality / 100
            });
            
            const avifBuffer = await avifBlob.arrayBuffer();
            
            return {
                buffer: new Uint8Array(avifBuffer),
                contentType: 'image/avif',
                quality: quality,
                compressionRatio: avifBuffer.byteLength / imageBuffer.length,
                originalSize: imageBuffer.length,
                compressedSize: avifBuffer.byteLength
            };
        } catch (error) {
            console.warn('AVIF conversion failed, falling back to WebP:', error.message);
            // Fallback to WebP conversion
            try {
                return await this.convertToWebP(imageBuffer, quality + 10, width, height);
            } catch (webpError) {
                console.error('WebP fallback also failed:', webpError);
                // Final fallback to original JPEG
                return {
                    buffer: imageBuffer,
                    contentType: 'image/jpeg',
                    quality: quality,
                    compressionRatio: 1,
                    originalSize: imageBuffer.length,
                    compressedSize: imageBuffer.length,
                    fallback: 'jpeg'
                };
            }
        }
    }
    
    static async resizeImage(imageBuffer, width, height, quality = 85) {
        try {
            // Create blob from buffer
            const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
            
            // Create image bitmap from blob
            const imageBitmap = await createImageBitmap(blob);
            
            // Calculate aspect ratio for smart resizing
            const aspectRatio = imageBitmap.width / imageBitmap.height;
            let targetWidth = width;
            let targetHeight = height;
            
            // If only one dimension specified, calculate the other
            if (width && !height) {
                targetHeight = width / aspectRatio;
            } else if (height && !width) {
                targetWidth = height * aspectRatio;
            }
            
            // If both specified but don't match aspect ratio, fit within bounds
            if (width && height) {
                const requestedRatio = width / height;
                if (requestedRatio > aspectRatio) {
                    // Image is taller, fit to height
                    targetWidth = height * aspectRatio;
                    targetHeight = height;
                } else {
                    // Image is wider, fit to width
                    targetWidth = width;
                    targetHeight = width / aspectRatio;
                }
            }
            
            // Create canvas with target dimensions
            const canvas = new OffscreenCanvas(Math.round(targetWidth), Math.round(targetHeight));
            const ctx = canvas.getContext('2d');
            
            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            // Draw resized image
            ctx.drawImage(imageBitmap, 0, 0, Math.round(targetWidth), Math.round(targetHeight));
            
            // Convert to JPEG with specified quality
            const resizedBlob = await canvas.convertToBlob({
                type: 'image/jpeg',
                quality: quality / 100
            });
            
            const resizedBuffer = await resizedBlob.arrayBuffer();
            
            return {
                buffer: new Uint8Array(resizedBuffer),
                width: Math.round(targetWidth),
                height: Math.round(targetHeight),
                quality: quality,
                originalSize: imageBuffer.length,
                resizedSize: resizedBuffer.byteLength,
                compressionRatio: resizedBuffer.byteLength / imageBuffer.length
            };
        } catch (error) {
            console.error('Image resizing failed:', error);
            // Return original image as fallback
            return {
                buffer: imageBuffer,
                width: null,
                height: null,
                quality: quality,
                originalSize: imageBuffer.length,
                resizedSize: imageBuffer.length,
                compressionRatio: 1,
                fallback: true
            };
        }
    }
    
    static async optimizeForVariant(imageBuffer, variant, format, filename = '') {
        try {
            const config = SIZE_VARIANTS[variant];
            if (!config) {
                throw new Error(`Unknown variant: ${variant}`);
            }
            
            let result;
            
            // Apply format conversion with resizing in one step for efficiency
            switch (format) {
                case 'webp':
                    result = await this.convertToWebP(
                        imageBuffer, 
                        config.quality, 
                        config.width, 
                        config.height
                    );
                    break;
                case 'avif':
                    result = await this.convertToAVIF(
                        imageBuffer, 
                        config.quality, 
                        config.width, 
                        config.height
                    );
                    break;
                case 'jpeg':
                default:
                    // For JPEG, just resize without format conversion
                    if (config.width || config.height) {
                        result = await this.resizeImage(imageBuffer, config.width, config.height, config.quality);
                        result.contentType = 'image/jpeg';
                    } else {
                        // No resizing needed for full variant JPEG
                        result = {
                            buffer: imageBuffer,
                            contentType: 'image/jpeg',
                            quality: config.quality,
                            originalSize: imageBuffer.length,
                            compressedSize: imageBuffer.length,
                            compressionRatio: 1
                        };
                    }
                    break;
            }
            
            // Determine actual format from content type
            let actualFormat = format;
            if (result.contentType === 'image/jpeg') actualFormat = 'jpeg';
            else if (result.contentType === 'image/webp') actualFormat = 'webp';
            else if (result.contentType === 'image/avif') actualFormat = 'avif';
            
            return {
                buffer: result.buffer,
                contentType: result.contentType,
                variant: variant,
                format: actualFormat, // Use actual format, not requested format
                requestedFormat: format, // Keep track of what was requested
                originalSize: imageBuffer.length,
                optimizedSize: result.compressedSize || result.resizedSize || result.buffer.length,
                compressionRatio: result.compressionRatio || (result.buffer.length / imageBuffer.length),
                fallback: result.fallback || false,
                quality: config.quality
            };
            
        } catch (error) {
            throw new Error(`Failed to optimize image for ${variant}/${format}: ${error.message}`);
        }
    }
    
    // Batch optimization for multiple formats
    static async optimizeMultiFormat(imageBuffer, variant, acceptedFormats = ['jpeg']) {
        const results = {};
        
        for (const format of acceptedFormats) {
            try {
                results[format] = await this.optimizeForVariant(imageBuffer, variant, format);
            } catch (error) {
                console.warn(`Failed to optimize for ${format}:`, error.message);
            }
        }
        
        return results;
    }
}

export { ImageProcessor, ImageOptimizer, SIZE_VARIANTS, selectOptimalFormat };