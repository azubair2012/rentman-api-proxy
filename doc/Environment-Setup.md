# Environment Setup Guide

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Cloudflare account
- Rentman API credentials

## Step 1: Cloudflare KV Storage Setup

### 1.1 Create KV Namespace
```bash
# Create KV namespace for featured properties
wrangler kv:namespace create "FEATURED_PROPERTIES"

# Create preview namespace for development
wrangler kv:namespace create "FEATURED_PROPERTIES" --preview
```

### 1.2 Update wrangler.jsonc
Replace the placeholder KV namespace IDs in `wrangler.jsonc` with the actual IDs from the previous step.

## Step 2: Environment Variables Setup

### 2.1 Create .dev.vars file
Create a `.dev.vars` file in the root directory with the following content:

```env
# Rentman API Credentials
RENTMAN_API_TOKEN=your_rentman_api_token_here
RENTMAN_API_USERNAME=your_rentman_username_here
RENTMAN_API_PASSWORD=your_rentman_password_here

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_admin_password_here

# CORS Settings
ALLOWED_ORIGINS=https://your-framer-site.com,http://localhost:3000
```

### 2.2 Set Production Secrets
```bash
# Set Rentman API credentials as secrets
wrangler secret put RENTMAN_API_TOKEN
wrangler secret put RENTMAN_API_USERNAME
wrangler secret put RENTMAN_API_PASSWORD

# Set admin credentials as secrets
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD
```

## Step 3: Local Development Setup

### 3.1 Install Dependencies
```bash
npm install
```

### 3.2 Start Development Server
```bash
npm run dev
```

The development server will start at `http://localhost:8787`

## Step 4: Verify Setup

### 4.1 Test Basic Endpoints
- Visit `http://localhost:8787/api/properties` to test property fetching
- Visit `http://localhost:8787/api/properties/featured` to test featured properties
- Visit `http://localhost:8787/admin` to access admin interface

### 4.2 Check KV Storage
```bash
# List KV entries
wrangler kv:key list --binding=FEATURED_PROPERTIES
```

## Security Notes
- Never commit `.dev.vars` to version control
- Use strong passwords for admin access
- Regularly rotate API credentials
- Monitor API usage and implement rate limiting

## Troubleshooting

### Common Issues
1. **KV Namespace Not Found**: Ensure KV namespace IDs are correctly set in wrangler.jsonc
2. **API Authentication Failed**: Verify Rentman API credentials are correct
3. **CORS Errors**: Check ALLOWED_ORIGINS configuration
4. **Admin Access Denied**: Verify admin credentials are set correctly

### Debug Commands
```bash
# Check wrangler configuration
wrangler whoami

# List all secrets
wrangler secret list

# Test KV operations
wrangler kv:key put --binding=FEATURED_PROPERTIES "test" "value"
wrangler kv:key get --binding=FEATURED_PROPERTIES "test"
``` 