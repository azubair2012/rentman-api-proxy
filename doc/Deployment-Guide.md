# Deployment Guide

## Overview
This guide covers the complete deployment process for the Rentman API proxy from development to production.

## Prerequisites
- Cloudflare account
- Rentman API credentials
- Node.js and npm installed
- Wrangler CLI installed

## Step 1: Local Development Setup

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Create Environment File
Create a `.dev.vars` file in the root directory:
```env
RENTMAN_API_TOKEN=your_rentman_api_token_here
RENTMAN_API_USERNAME=your_rentman_username_here
RENTMAN_API_PASSWORD=your_rentman_password_here
```

### 1.3 Test Locally
```bash
npm run dev
```
Visit `http://localhost:8787` to test your API locally.

## Step 2: Cloudflare KV Storage Setup

### 2.1 Create KV Namespace
```bash
# Create production KV namespace
wrangler kv:namespace create "FEATURED_PROPERTIES"

# Create preview KV namespace for development
wrangler kv:namespace create "FEATURED_PROPERTIES" --preview
```

### 2.2 Update Configuration
Replace the placeholder KV namespace IDs in `wrangler.jsonc` with the actual IDs from the previous step.

## Step 3: Set Production Secrets

### 3.1 Set API Credentials
```bash
# Set Rentman API credentials
wrangler secret put RENTMAN_API_TOKEN
wrangler secret put RENTMAN_API_USERNAME
wrangler secret put RENTMAN_API_PASSWORD
```

### 3.2 Verify Secrets
```bash
# List all secrets (names only, not values)
wrangler secret list
```

## Step 4: Deploy to Production

### 4.1 Deploy Worker
```bash
npm run deploy
```

### 4.2 Verify Deployment
1. Check the deployment URL provided by Wrangler
2. Test the API endpoints:
   - `https://your-worker.workers.dev/`
   - `https://your-worker.workers.dev/api/properties`
   - `https://your-worker.workers.dev/admin`

### 4.3 Check Worker Status
```bash
# Check worker status
wrangler tail
```

## Step 5: Domain Configuration (Optional)

### 5.1 Custom Domain Setup
1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to Settings > Triggers
5. Add custom domain

### 5.2 SSL Configuration
- SSL is automatically configured by Cloudflare
- Ensure your domain has SSL enabled

## Step 6: Environment-Specific Configuration

### 6.1 Production Environment
```bash
# Deploy to production
wrangler deploy --env production
```

### 6.2 Staging Environment
```bash
# Create staging environment
wrangler deploy --env staging
```

### 6.3 Environment Variables
Configure different variables for each environment:
```bash
# Set staging variables
wrangler secret put RENTMAN_API_TOKEN --env staging
wrangler secret put RENTMAN_API_USERNAME --env staging
wrangler secret put RENTMAN_API_PASSWORD --env staging
```

## Step 7: Monitoring and Logs

### 7.1 Enable Logging
```bash
# View real-time logs
wrangler tail

# View specific log levels
wrangler tail --format pretty
```

### 7.2 Set Up Alerts
1. Configure Cloudflare Analytics
2. Set up error monitoring
3. Configure performance alerts

## Step 8: Performance Optimization

### 8.1 Caching Strategy
- Implement appropriate cache headers
- Configure CDN settings
- Optimize API responses

### 8.2 Rate Limiting
Consider implementing rate limiting for production:
```javascript
// Add to your worker
const rateLimiter = {
  // Implement rate limiting logic
};
```

## Step 9: Security Configuration

### 9.1 CORS Settings
Update CORS headers for production:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-framer-site.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

### 9.2 Admin Authentication
Implement proper authentication for admin endpoints:
```javascript
// Add authentication middleware
function requireAuth(request) {
  // Implement authentication logic
}
```

## Step 10: Testing Production Deployment

### 10.1 API Endpoint Testing
```bash
# Test all endpoints
curl https://your-worker.workers.dev/
curl https://your-worker.workers.dev/api/properties
curl https://your-worker.workers.dev/api/properties/featured
```

### 10.2 Admin Interface Testing
1. Visit `https://your-worker.workers.dev/admin`
2. Test property management functionality
3. Verify featured property toggling

### 10.3 CORS Testing
Test cross-origin requests from your Framer site:
```javascript
fetch('https://your-worker.workers.dev/api/properties/featured')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Step 11: Backup and Recovery

### 11.1 KV Data Backup
```bash
# Export KV data
wrangler kv:key list --binding=FEATURED_PROPERTIES

# Backup featured properties
wrangler kv:key get --binding=FEATURED_PROPERTIES "featured_properties"
```

### 11.2 Configuration Backup
- Backup `wrangler.jsonc` configuration
- Document all environment variables
- Keep deployment scripts in version control

## Step 12: Maintenance and Updates

### 12.1 Regular Updates
```bash
# Update dependencies
npm update

# Deploy updates
npm run deploy
```

### 12.2 Monitoring
- Monitor API response times
- Track error rates
- Monitor KV storage usage

### 12.3 Scaling
- Monitor worker performance
- Adjust resources as needed
- Consider implementing caching strategies

## Troubleshooting

### Common Deployment Issues

1. **KV Namespace Not Found**
   ```bash
   # Recreate KV namespace
   wrangler kv:namespace create "FEATURED_PROPERTIES"
   ```

2. **Secrets Not Set**
   ```bash
   # Check secrets
   wrangler secret list
   
   # Set missing secrets
   wrangler secret put SECRET_NAME
   ```

3. **CORS Errors**
   - Check CORS configuration
   - Verify allowed origins
   - Test with different domains

4. **API Authentication Failed**
   - Verify Rentman API credentials
   - Check API endpoint URLs
   - Test API connectivity

### Debug Commands
```bash
# Check worker status
wrangler whoami

# View worker logs
wrangler tail

# Test KV operations
wrangler kv:key put --binding=FEATURED_PROPERTIES "test" "value"
wrangler kv:key get --binding=FEATURED_PROPERTIES "test"

# Check worker configuration
wrangler config
```

## Performance Monitoring

### 12.1 Cloudflare Analytics
- Monitor request volume
- Track response times
- Analyze error rates

### 12.2 Custom Metrics
- Track featured property changes
- Monitor API usage patterns
- Log performance metrics

## Security Best Practices

1. **Secrets Management**
   - Never commit secrets to version control
   - Use Wrangler secrets for sensitive data
   - Rotate credentials regularly

2. **Access Control**
   - Implement proper authentication
   - Restrict admin access
   - Monitor access logs

3. **Data Protection**
   - Encrypt sensitive data
   - Implement data validation
   - Regular security audits

## Rollback Procedures

### 12.1 Code Rollback
```bash
# Deploy previous version
git checkout previous-commit
npm run deploy
```

### 12.2 Configuration Rollback
```bash
# Restore previous configuration
git checkout previous-commit wrangler.jsonc
npm run deploy
```

## Support and Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler)
- [Cloudflare Support](https://support.cloudflare.com)

## Next Steps

After successful deployment:

1. **Integrate with Framer**: Follow the Framer Integration Guide
2. **Set up monitoring**: Configure alerts and logging
3. **Test thoroughly**: Verify all functionality works in production
4. **Document**: Update documentation with production URLs
5. **Train users**: Provide admin interface training 