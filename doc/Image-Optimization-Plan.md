# Image Optimization Plan

## Overview

This document outlines comprehensive image optimization strategies for the Rentman API Proxy to significantly reduce payload sizes and improve loading performance.

## Current State Analysis

### Performance Issues Identified
- **Large Payloads**: Images delivered as base64 data in JSON responses (~800KB+ per image)
- **Inefficient Format**: All images served as JPEG regardless of original format
- **No Size Variants**: Single full-resolution images for all use cases
- **Bandwidth Waste**: Base64 encoding adds ~33% overhead to binary data

### Current Implementation
- Images cached in KV storage for 1 hour
- Basic `ImageProcessor` class with minimal processing
- Placeholder `compressBase64Image` function (not implemented)
- Format detection based on filename extension only

## Optimization Opportunities

### 1. Format Optimization
**Current**: All images served as JPEG
**Proposed**: Smart format selection

- **WebP**: 60-80% smaller than JPEG, supported by 95% of browsers
- **AVIF**: 90% smaller than JPEG, supported by 85% of browsers
- **Progressive JPEG**: Faster perceived loading for fallback cases
- **Format negotiation**: Based on `Accept` header and User-Agent

### 2. Size Optimization
**Current**: Single full-resolution images
**Proposed**: Multiple size variants

- **Thumbnail**: 300px width for listings (30-50KB)
- **Medium**: 800px width for detail views (80-150KB)
- **Full**: Original resolution for zoom/download (200-500KB)
- **Quality levels**: 85% for medium/full, 75% for thumbnails

### 3. Delivery Architecture
**Current**: Base64 in JSON responses
**Proposed**: Dedicated image endpoints

```
Current:  GET /api/properties -> JSON with base64 images
Proposed: GET /api/properties -> JSON with image URLs
          GET /api/images/{propref}/thumbnail
          GET /api/images/{propref}/medium
          GET /api/images/{propref}/full
```

### 4. Advanced Features

#### Client Hints Support
```http
Accept: image/avif,image/webp,image/jpeg
Viewport-Width: 1920
DPR: 2
```

#### Progressive Loading
- Blur placeholder generation (1KB base64)
- Lazy loading with intersection observer
- Smooth transitions between quality levels

## Implementation Strategy

### Phase 1: Endpoint Architecture
**Duration**: 1-2 days
**Impact**: Foundation for all optimizations

```javascript
// New endpoint structure
app.get('/api/images/:propref/:variant?', handleImageRequest);
app.get('/api/images/:propref/:variant/:format?', handleImageRequest);

// Variants: thumbnail, medium, full
// Formats: webp, avif, jpeg, auto
```

### Phase 2: Format Conversion
**Duration**: 2-3 days
**Impact**: 60-80% size reduction

```javascript
class ImageOptimizer {
    static async convertToWebP(imageBuffer, quality = 85) {
        // Use Canvas API or sharp-wasm for conversion
    }
    
    static async convertToAVIF(imageBuffer, quality = 75) {
        // AVIF conversion with fallback
    }
}
```

### Phase 3: Size Variants
**Duration**: 2-3 days
**Impact**: Further 40-60% reduction for thumbnails

```javascript
const sizeVariants = {
    thumbnail: { width: 300, quality: 75 },
    medium: { width: 800, quality: 85 },
    full: { quality: 90 }
};
```

### Phase 4: Advanced Features
**Duration**: 3-4 days
**Impact**: Enhanced UX and perceived performance

- Client hint negotiation
- Blur placeholder generation
- Progressive quality enhancement

## Technical Implementation

### Modified API Response Structure
```json
{
  "success": true,
  "data": [
    {
      "propref": 28,
      "displayaddress": "42 Catherall Road, Highbury",
      "images": {
        "thumbnail": "/api/images/28/thumbnail",
        "medium": "/api/images/28/medium", 
        "full": "/api/images/28/full",
        "placeholder": "data:image/jpeg;base64,/9j/4AAQSkZJRg..." // 1KB blur
      }
    }
  ]
}
```

### Caching Strategy
```javascript
// Cache keys for different variants
const cacheKeys = {
    metadata: `prop_${propref}_meta`,
    thumbnail_webp: `img_${propref}_thumb_webp`,
    medium_webp: `img_${propref}_med_webp`,
    full_jpeg: `img_${propref}_full_jpg`,
    placeholder: `img_${propref}_blur`
};

// Different TTL for different variants
const cacheTTL = {
    placeholder: 7 * 24 * 3600,  // 1 week
    thumbnail: 24 * 3600,        // 1 day  
    medium: 12 * 3600,           // 12 hours
    full: 6 * 3600               // 6 hours
};
```

### Format Negotiation Logic
```javascript
function selectOptimalFormat(acceptHeader, userAgent) {
    if (acceptHeader.includes('image/avif') && isModernBrowser(userAgent)) {
        return 'avif';
    }
    if (acceptHeader.includes('image/webp')) {
        return 'webp';
    }
    return 'jpeg';
}
```

## Expected Performance Improvements

### Bandwidth Reduction
- **Thumbnails**: 800KB → 30-50KB (94% reduction)
- **Medium images**: 800KB → 80-150KB (80% reduction)  
- **Format optimization**: Additional 60-80% on top of size reduction
- **Overall**: 90-95% bandwidth reduction for typical usage

### Loading Performance
- **First paint**: Instant with blur placeholders
- **Perceived loading**: 3x faster with progressive loading
- **Cache efficiency**: Higher hit rates with smaller variants

### User Experience
- **Instant thumbnails**: Sub-100ms loading for property listings
- **Smooth transitions**: Progressive quality enhancement
- **Mobile optimization**: Automatic size/format selection

## Migration Strategy

### Backward Compatibility
- Keep existing base64 responses for 30 days
- Add deprecation headers to old endpoints
- Provide migration guide for Framer integration

### Gradual Rollout
1. **Week 1**: Deploy new endpoints alongside existing ones
2. **Week 2**: Update admin interface to use new endpoints  
3. **Week 3**: Update Framer integration
4. **Week 4**: Deprecate base64 responses

## Monitoring & Metrics

### Performance Metrics
- Image load times by variant and format
- Cache hit rates for different sizes
- Bandwidth usage reduction
- Error rates for format conversion

### Business Impact
- Property view engagement rates
- Time spent on property details
- Mobile vs desktop performance comparison

## Future Enhancements

### Phase 5: Smart Optimization
- AI-powered quality selection based on image content
- Automatic focal point detection for smart cropping
- Dynamic quality adjustment based on network conditions

### Phase 6: CDN Integration
- Cloudflare Image Resizing integration
- Edge-side image transformation
- Global performance optimization

## Success Criteria

- [ ] 90%+ reduction in image-related bandwidth usage
- [ ] Sub-100ms thumbnail loading times
- [ ] 95%+ client satisfaction with image quality
- [ ] Zero increase in error rates during migration
- [ ] Successful Framer integration with new endpoints

---

**Document Version**: 1.0  
**Last Updated**: September 12, 2025  
**Author**: Claude Code Assistant  
**Status**: Planning Phase