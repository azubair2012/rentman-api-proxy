# Framer Integration Guide

## Overview
This guide explains how to integrate the Rentman API proxy with your Framer website to display featured properties dynamically.

## Prerequisites
- Framer account and project
- Deployed Rentman API proxy (Cloudflare Worker)
- Rentman API credentials configured

## Step 1: Set Up Framer Project

### 1.1 Create New Framer Project
1. Log into your Framer account
2. Create a new project or open existing project
3. Set up your project structure

### 1.2 Configure Project Settings
1. Go to Project Settings
2. Add your API domain to allowed origins if needed
3. Configure any necessary environment variables

## Step 2: Create Featured Properties Component

### 2.1 Create Property Card Component
1. Create a new component called `PropertyCard`
2. Add the following properties:
   - `propref` (Text)
   - `displayaddress` (Text)
   - `displayprice` (Text)
   - `photo1` (Text)
   - `beds` (Number)
   - `baths` (Number)
   - `TYPE` (Text)

### 2.2 Design Property Card Layout
```jsx
// Property Card Component Structure
<Frame>
  <Image src={photo1} />
  <Text>{displayaddress}</Text>
  <Text>{displayprice}</Text>
  <Text>{beds} beds • {baths} baths • {TYPE}</Text>
</Frame>
```

## Step 3: Create Featured Properties Section

### 3.1 Add Featured Properties Container
1. Create a new frame for featured properties
2. Add a heading: "Featured Properties"
3. Create a grid layout for property cards

### 3.2 Configure Data Source
1. Add a **Fetch** component to your page
2. Configure the fetch URL to your API endpoint:
   ```
   https://your-worker.workers.dev/api/properties/featured
   ```
3. Set method to `GET`
4. Add headers if needed:
   ```
   Content-Type: application/json
   ```

### 3.3 Connect Data to Components
1. Select your PropertyCard component
2. In the component properties, bind each field to the fetch data:
   - `propref` → `data.data[0].propref`
   - `displayaddress` → `data.data[0].displayaddress`
   - `displayprice` → `data.data[0].displayprice`
   - `photo1` → `data.data[0].photo1`
   - `beds` → `data.data[0].beds`
   - `baths` → `data.data[0].baths`
   - `TYPE` → `data.data[0].TYPE`

### 3.4 Set Up Repeater
1. Select your PropertyCard component
2. Enable "Repeat" in the component settings
3. Set the repeat data source to `data.data`
4. Configure the repeat binding:
   - `propref` → `item.propref`
   - `displayaddress` → `item.displayaddress`
   - `displayprice` → `item.displayprice`
   - `photo1` → `item.photo1`
   - `beds` → `item.beds`
   - `baths` → `item.baths`
   - `TYPE` → `item.TYPE`

## Step 4: Add Loading and Error States

### 4.1 Loading State
1. Create a loading component (spinner or skeleton)
2. Show loading state when `fetch.loading` is true
3. Hide loading state when data is loaded

### 4.2 Error State
1. Create an error message component
2. Show error state when `fetch.error` exists
3. Display appropriate error message

### 4.3 Conditional Rendering
```jsx
// Conditional rendering logic
{fetch.loading && <LoadingComponent />}
{fetch.error && <ErrorComponent message={fetch.error} />}
{!fetch.loading && !fetch.error && data.data && (
  <FeaturedPropertiesGrid>
    {/* Property cards will render here */}
  </FeaturedPropertiesGrid>
)}
```

## Step 5: Add Property Detail Pages

### 5.1 Create Property Detail Component
1. Create a new page for property details
2. Add URL parameter for property ID
3. Create detailed property view

### 5.2 Configure Property Links
1. Make property cards clickable
2. Add navigation to property detail page
3. Pass property ID as URL parameter

### 5.3 Fetch Individual Property Data
1. Use the property ID from URL parameters
2. Fetch specific property data from your API
3. Display detailed property information

## Step 6: Add Search and Filtering

### 6.1 Create Search Component
1. Add search input field
2. Create search functionality using Framer's built-in filtering
3. Filter properties based on address, price, or type

### 6.2 Add Filter Controls
1. Create filter buttons (by type, price range, etc.)
2. Implement filter logic
3. Update property display based on filters

## Step 7: Responsive Design

### 7.1 Mobile Optimization
1. Test on mobile devices
2. Adjust grid layout for smaller screens
3. Optimize images for mobile loading

### 7.2 Tablet Optimization
1. Test on tablet devices
2. Adjust layout for medium screens
3. Ensure touch-friendly interactions

## Step 8: Performance Optimization

### 8.1 Image Optimization
1. Use optimized images from Rentman API
2. Implement lazy loading for property images
3. Add image placeholders

### 8.2 Caching Strategy
1. Leverage Framer's built-in caching
2. Configure appropriate cache headers
3. Implement client-side caching if needed

## Step 9: Testing and Debugging

### 9.1 Test API Integration
1. Verify API endpoints are working
2. Test with real Rentman data
3. Check for CORS issues

### 9.2 Debug Common Issues
1. **CORS Errors**: Ensure API allows your Framer domain
2. **Data Not Loading**: Check API response format
3. **Images Not Displaying**: Verify image URLs are accessible

### 9.3 Browser Testing
1. Test in different browsers
2. Check mobile responsiveness
3. Verify all interactions work correctly

## Step 10: Deployment

### 10.1 Publish Framer Site
1. Publish your Framer project
2. Configure custom domain if needed
3. Test live site functionality

### 10.2 Monitor Performance
1. Check site loading times
2. Monitor API response times
3. Track user interactions

## Advanced Features

### Real-time Updates
- Set up webhook integration for real-time property updates
- Implement polling for automatic data refresh
- Add notification system for new properties

### Analytics Integration
- Add Google Analytics tracking
- Track property view interactions
- Monitor featured property performance

### SEO Optimization
- Add structured data for properties
- Implement proper meta tags
- Create property-specific URLs

## Troubleshooting

### Common Issues

1. **API Not Responding**
   - Check Cloudflare Worker status
   - Verify API credentials
   - Test API endpoints directly

2. **Data Not Displaying**
   - Check fetch configuration
   - Verify data binding
   - Test with sample data

3. **Images Not Loading**
   - Check image URLs
   - Verify CORS settings
   - Test image accessibility

4. **Performance Issues**
   - Optimize image sizes
   - Implement lazy loading
   - Check API response times

### Debug Commands
```javascript
// Test API endpoint
fetch('https://your-worker.workers.dev/api/properties/featured')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

## Best Practices

1. **Error Handling**: Always implement proper error handling
2. **Loading States**: Show loading indicators for better UX
3. **Fallback Content**: Provide fallback content when data is unavailable
4. **Accessibility**: Ensure your components are accessible
5. **Performance**: Optimize for fast loading times
6. **Mobile First**: Design for mobile devices first
7. **Testing**: Test thoroughly across different devices and browsers

## Support Resources

- [Framer Documentation](https://framer.com/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers)
- [Rentman API Documentation](https://api.rentman.net/docs) 