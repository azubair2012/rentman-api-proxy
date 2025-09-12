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

            // For now, return the original with appropriate headers
            // TODO: Implement actual resizing using Canvas API or sharp-wasm
            const { binary, contentType } = await this.processBase64Image(base64Data, filename);
            
            // Determine optimal format
            let outputFormat = format;
            if (format === 'auto') {
                outputFormat = 'webp'; // Default to WebP for auto
            }

            // Set appropriate content type
            let outputContentType = `image/${outputFormat}`;
            
            return {
                binary,
                contentType: outputContentType,
                variant,
                format: outputFormat,
                originalSize: binary.length,
                // TODO: Add actual compressed size when implementing compression
                compressedSize: binary.length
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
    static async convertToWebP(imageBuffer, quality = 85) {
        // TODO: Implement WebP conversion using Canvas API or sharp-wasm
        // For now, return original buffer with WebP content type
        console.warn('WebP conversion not yet implemented - returning original');
        return {
            buffer: imageBuffer,
            contentType: 'image/webp',
            quality: quality,
            compressionRatio: 0.7 // Estimated 70% of original size
        };
    }
    
    static async convertToAVIF(imageBuffer, quality = 75) {
        // TODO: Implement AVIF conversion using Canvas API or sharp-wasm
        // For now, return original buffer with AVIF content type
        console.warn('AVIF conversion not yet implemented - returning original');
        return {
            buffer: imageBuffer,
            contentType: 'image/avif',
            quality: quality,
            compressionRatio: 0.5 // Estimated 50% of original size
        };
    }
    
    static async resizeImage(imageBuffer, width, height, quality = 85) {
        // TODO: Implement image resizing using Canvas API or sharp-wasm
        // For now, return original buffer
        console.warn('Image resizing not yet implemented - returning original');
        return {
            buffer: imageBuffer,
            width: width,
            height: height,
            quality: quality
        };
    }
    
    static async optimizeForVariant(imageBuffer, variant, format, filename = '') {
        try {
            const config = SIZE_VARIANTS[variant];
            if (!config) {
                throw new Error(`Unknown variant: ${variant}`);
            }
            
            let processedBuffer = imageBuffer;
            let contentType = 'image/jpeg';
            
            // Apply format conversion
            switch (format) {
                case 'webp':
                    const webpResult = await this.convertToWebP(processedBuffer, config.quality);
                    processedBuffer = webpResult.buffer;
                    contentType = webpResult.contentType;
                    break;
                case 'avif':
                    const avifResult = await this.convertToAVIF(processedBuffer, config.quality);
                    processedBuffer = avifResult.buffer;
                    contentType = avifResult.contentType;
                    break;
                case 'jpeg':
                default:
                    contentType = 'image/jpeg';
                    break;
            }
            
            // Apply resizing if dimensions specified
            if (config.width && config.height) {
                const resizeResult = await this.resizeImage(processedBuffer, config.width, config.height, config.quality);
                processedBuffer = resizeResult.buffer;
            }
            
            return {
                buffer: processedBuffer,
                contentType: contentType,
                variant: variant,
                format: format,
                originalSize: imageBuffer.length,
                optimizedSize: processedBuffer.length,
                compressionRatio: processedBuffer.length / imageBuffer.length
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