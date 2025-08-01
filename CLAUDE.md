# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start local development server (Cloudflare Workers)
- `npm start` - Alias for dev command
- `npm test` - Run Vitest tests with Cloudflare Workers pool
- `npm run deploy` - Deploy to Cloudflare Workers using Wrangler

### Testing
- Tests use Vitest with `@cloudflare/vitest-pool-workers` for realistic Cloudflare Workers environment
- Main test file: `test/api.test.js`
- Additional test utilities: `test-rentman-api.js`, `test-simple.js`

## Architecture Overview

This is a **Cloudflare Workers-based API proxy** that sits between Framer websites and the Rentman property management system. The architecture follows a modular design:

### Core Classes
- **RentmanAPI** (`src/classes/RentmanAPI.js`) - Handles all Rentman API communication with caching, timeouts, and error handling
- **FeaturedPropertiesManager** (`src/classes/FeaturedPropertiesManager.js`) - Manages featured property selections (min 7, max 10 properties) using Cloudflare KV storage
- **ImageProcessor** (`src/classes/ImageProcessor.js`) - Handles image processing and optimization

### Request Flow
1. **Entry Point**: `src/index.js` - Main Cloudflare Worker handler with routing and CORS
2. **Handlers**: `src/handlers/propertyHandlers.js` - Process API requests for properties
3. **Views**: `src/views/adminView.js` - Generate HTML for admin dashboard
4. **Persistence**: Cloudflare KV storage for featured property selections

### Key API Endpoints
- `/api/properties` - Get all properties from Rentman
- `/api/featured` - Get featured properties 
- `/api/featured/toggle` - Toggle featured property status
- `/admin` - Admin dashboard for property management

## Environment & Configuration

### Required Environment Variables
- `RENTMAN_API_TOKEN` - Rentman API authentication token
- `RENTMAN_API_BASE_URL` - Rentman API base URL (default: https://www.rentman.online)
- `MAX_FEATURED_PROPERTIES` - Maximum featured properties (currently 7)

### Configuration Files
- `wrangler.jsonc` - Cloudflare Workers config with KV namespace bindings
- `.dev.vars` - Local environment variables (not in repo)
- `vitest.config.js` - Test configuration referencing wrangler.jsonc

## Current State
- **Development Phase**: Phase 1 & 2 complete, ready for deployment
- **Authentication**: Currently disabled for development simplicity
- **Caching**: 5 minutes for properties, 1 hour for images
- **Featured Properties**: Min 7, max 10 property limit enforced

## Development Notes
- Uses Cloudflare Workers runtime with Node.js compatibility enabled  
- KV storage namespace binding required for featured properties persistence
- CORS enabled for Framer website integration
- Request timeouts set to 10 seconds for external API calls
- No authentication currently required (development mode)

## Development Principles
- We will follow the TDD principles. any features implemented needs to be tested before.

## Workflow Guidelines
- Everytime user types `cc claude` should commit all the changes with proper detailed commit message and push it