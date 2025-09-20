# Affilist Server

Backend API server for the Affilist affiliate link aggregator application.

## Features

- Express.js server with TypeScript
- Security middleware (Helmet, CORS, Rate limiting)
- Comprehensive error handling and logging
- Health check endpoints
- Environment-based configuration
- Comprehensive test suite

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:
- `JWT_SECRET`: Secret key for JWT token signing
- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production/test)

### Development

Start the development server with hot reload:

```bash
npm run dev
```

### Testing

Run the test suite:

```bash
npm test        # Watch mode
npm run test:run # Single run
```

### Production

Build and start the production server:

```bash
npm run build
npm start
```

## API Endpoints

### Health Checks

- `GET /health` - Basic health check
- `GET /ready` - Readiness check with service status

### API Information

- `GET /api` - API information and available endpoints

## Project Structure

```
src/
├── config/         # Environment configuration
├── middleware/     # Express middleware
├── routes/         # API route handlers
├── utils/          # Utility functions
├── __tests__/      # Test files
└── index.ts        # Application entry point
```

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Request logging
- Error handling with sanitized responses

## Development Guidelines

- Use TypeScript strict mode
- Write tests for all new functionality
- Follow RESTful API conventions
- Use proper HTTP status codes
- Implement proper error handling