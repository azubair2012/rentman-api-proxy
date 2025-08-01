# Rentman API Proxy

A powerful Cloudflare Worker that provides a secure interface between your Framer website and the Rentman property management system, with advanced featured properties management functionality.

## 🚀 Features

- **Rentman API Integration**: Secure proxy for Rentman property data
- **Featured Properties Management**: Manual selection system for featured properties
- **Admin Dashboard**: Web-based interface for property management
- **CORS Support**: Cross-origin request support for Framer integration
- **Cloudflare KV Storage**: Persistent storage for featured property selections
- **Real-time Updates**: Dynamic property management with instant updates
- **Responsive Design**: Mobile-friendly admin interface

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Cloudflare account
- Rentman API credentials

## 🛠️ Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd rentman-api-proxy
npm install
```

### 2. Environment Setup

Create a `.dev.vars` file in the root directory:

```env
RENTMAN_API_TOKEN=your_rentman_api_token_here
RENTMAN_API_USERNAME=your_rentman_username_here
RENTMAN_API_PASSWORD=your_rentman_password_here
```

### 3. Cloudflare KV Setup

```bash
# Create KV namespace for featured properties
wrangler kv:namespace create "FEATURED_PROPERTIES"

# Create preview namespace for development
wrangler kv:namespace create "FEATURED_PROPERTIES" --preview
```

Update the KV namespace IDs in `wrangler.jsonc` with the actual IDs from the previous step.

### 4. Local Development

```bash
npm run dev
```

Visit `http://localhost:8787` to test your API locally.

### 5. Deploy to Production

```bash
# Set production secrets (if re-enabling authentication)
wrangler secret put ADMIN_USERNAME
wrangler secret put ADMIN_PASSWORD  
wrangler secret put SESSION_SECRET

# Deploy
npm run deploy
```

## 📚 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information / Admin dashboard |
| `/admin` | GET | Admin dashboard |
| `/api/properties` | GET | Get all properties |
| `/api/featured` | GET | Get featured properties |

**Note:** Authentication is currently disabled for development purposes.

## 🎨 Admin Interface

Access the admin dashboard at `/` or `/admin` to:

- View all properties from Rentman
- Browse property listings with search functionality
- Monitor property data
- Real-time updates without page refresh

## 🔗 Framer Integration

The API is designed for seamless Framer integration:

```javascript
// Fetch all properties
const allResponse = await fetch('https://your-worker.workers.dev/api/properties');
const allData = await allResponse.json();

// Fetch featured properties
const featuredResponse = await fetch('https://your-worker.workers.dev/api/featured');
const featuredData = await featuredResponse.json();

if (featuredData.success) {
  // Use featuredData.data array in Framer
  console.log(featuredData.data);
}
```

## 📖 Documentation

- [Development Plan](./doc/Development-Plan.md) - Complete development roadmap
- [Environment Setup](./doc/Environment-Setup.md) - Environment configuration guide
- [API Documentation](./doc/API-Documentation.md) - Complete API reference
- [Framer Integration Guide](./doc/Framer-Integration-Guide.md) - Framer setup and integration
- [Deployment Guide](./doc/Deployment-Guide.md) - Production deployment instructions

## 🏗️ Project Structure

```
rentman-api-proxy/
├── src/
│   ├── index.js              # Main Cloudflare Worker
│   ├── handlers/             # Request handlers
│   ├── classes/              # API classes
│   ├── views/                # HTML views
│   └── utils/                # Utility functions
├── doc/                      # Documentation
├── public/                   # Static assets
├── test/                     # Test files
├── wrangler.jsonc            # Cloudflare Worker configuration
├── package.json              # Dependencies and scripts
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RENTMAN_API_TOKEN` | Rentman API authentication token | Yes |
| `RENTMAN_API_USERNAME` | Rentman API username | Yes |
| `RENTMAN_API_PASSWORD` | Rentman API password | Yes |
| `RENTMAN_API_BASE_URL` | Rentman API base URL | No (default: https://api.rentman.net) |
| `MAX_FEATURED_PROPERTIES` | Maximum featured properties | No (default: 6) |

### Cloudflare KV Storage

The project uses Cloudflare KV storage to persist featured property selections:

- **Namespace**: `FEATURED_PROPERTIES`
- **Key**: `featured_properties`
- **Value**: JSON array of property IDs

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📊 Monitoring

### Logs
```bash
# View real-time logs
wrangler tail

# View formatted logs
wrangler tail --format pretty
```

### Analytics
- Monitor request volume and response times
- Track error rates and performance metrics
- Analyze featured property usage patterns

## 🔒 Security

- **API Credentials**: Stored securely as Cloudflare secrets
- **CORS**: Configurable cross-origin request policies
- **HTTPS**: Automatic SSL/TLS encryption
- **Rate Limiting**: Configurable request rate limiting
- **Input Validation**: Comprehensive request validation
- **Authentication**: Currently disabled for development

## 🚀 Performance

- **Global CDN**: Cloudflare's global network
- **Edge Computing**: Serverless execution at the edge
- **Caching**: Configurable response caching
- **Optimized Responses**: Minimal payload sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the [doc](./doc/) folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and help

## 🔄 Updates

Stay updated with the latest features and improvements:

```bash
# Update dependencies
npm update

# Deploy updates
npm run deploy
```

## 📈 Roadmap

- [ ] Advanced authentication system
- [ ] Property analytics dashboard
- [ ] Automated featured property rotation
- [ ] Webhook integration for real-time updates
- [ ] Advanced search and filtering
- [ ] Property image optimization
- [ ] Multi-language support

## 🙏 Acknowledgments

- [Cloudflare Workers](https://workers.cloudflare.com/) for the serverless platform
- [Rentman](https://rentman.net/) for the property management API
- [Framer](https://framer.com/) for the website building platform

---

**Built with ❤️ for real estate professionals**

## 🔄 Current Status

**Development Mode**: The application is currently running without authentication to simplify development and testing. All endpoints are accessible without login requirements. 