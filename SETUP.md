# 🏗️ Setup Guide - Premium Real Estate Chatbot

This guide will help you set up the complete real estate chatbot system with database and sample property listings.

## 🚀 Quick Start (Without Database)

If you want to run the application immediately without setting up MongoDB:

```bash
# 1. Install dependencies
npm install

# 2. Start the application
npm start

# 3. Access the application
# Open http://localhost:3000 in your browser
```

The application will run with in-memory storage and basic functionality.

## 🗄️ Full Setup with Database

### Prerequisites

1. **Node.js 16+** - [Download here](https://nodejs.org/)
2. **MongoDB 4.4+** - [Installation guide](https://docs.mongodb.com/manual/installation/)
3. **Redis 6.0+** (Optional) - [Installation guide](https://redis.io/download)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```bash
cp env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/real-estate-chatbot

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key-here

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Client Configuration
CLIENT_URL=http://localhost:3000
```

### Step 3: Start MongoDB

**Ubuntu/Debian:**
```bash
# Install MongoDB
sudo apt update
sudo apt install mongodb

# Start MongoDB service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Verify MongoDB is running
sudo systemctl status mongodb
```

**macOS:**
```bash
# Install MongoDB using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community
```

**Windows:**
1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and start the MongoDB service
3. MongoDB will run on `mongodb://localhost:27017`

### Step 4: Setup Database

```bash
# Setup database structure
npm run db:setup

# Seed with sample properties
npm run db:seed

# Or do both at once
npm run db:reset
```

### Step 5: Start the Application

```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start
```

### Step 6: Access the Application

- **Web Interface**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

## 🏠 Sample Property Data

The system comes with 6 sample properties in Bangalore:

### Featured Properties:
1. **Luxury 3BHK Apartment in Indiranagar** - ₹2.5 Cr
2. **Premium 2BHK Apartment in Koramangala** - ₹45K/month rent
3. **Luxury Villa in Whitefield** - ₹8.5 Cr
4. **Commercial Office Space in MG Road** - ₹1.5L/month lease
5. **Luxury Penthouse in Jayanagar** - ₹12 Cr

### Regular Properties:
6. **Modern 1BHK Apartment in Electronic City** - ₹25K/month rent

### Property Types Included:
- **Residential**: Apartments, Villas, Penthouses
- **Commercial**: Office spaces
- **Categories**: Sale, Rent, Lease
- **Locations**: Indiranagar, Koramangala, Whitefield, MG Road, Electronic City, Jayanagar

## 🤖 Chatbot Features

### Available Commands:
- "I want to buy a property in Indiranagar"
- "Show me 2BHK apartments for rent"
- "What are the current market trends?"
- "I need a commercial space in MG Road"
- "Tell me about properties in Whitefield"

### Property Search:
- By location (Indiranagar, Koramangala, etc.)
- By type (residential, commercial, villa)
- By budget (price range)
- By bedrooms (1BHK, 2BHK, 3BHK, etc.)

## 🔧 Database Management

### Available Scripts:

```bash
# Setup database structure
npm run db:setup

# Seed with sample data
npm run db:seed

# Reset database (setup + seed)
npm run db:reset

# View database status
curl http://localhost:3000/health
```

### Database Collections:
- **properties**: Property listings with full details
- **chats**: Conversation history and context
- **users**: User accounts (when authentication is enabled)

## 🧪 Testing the System

### 1. Test API Endpoints:

```bash
# Health check
curl http://localhost:3000/health

# Chat API
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to buy a property in Bangalore"}'

# Get all properties
curl http://localhost:3000/api/properties

# Get featured properties
curl http://localhost:3000/api/properties/featured/list
```

### 2. Test Web Interface:
1. Open http://localhost:3000
2. Try the chat interface
3. Search for properties
4. Test the contact forms

### 3. Test Real-time Features:
1. Open multiple browser tabs
2. Send messages in the chat
3. Verify real-time updates

## 🔒 Security Features

The application includes:
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS Protection**: Secure cross-origin requests
- **Helmet Security**: HTTP headers security
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Graceful error management

## 📊 Monitoring

### Logs:
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Exception logs: `logs/exceptions.log`

### Health Check:
```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-08-01T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

## 🚀 Production Deployment

### Environment Variables for Production:
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://your-production-mongodb-uri
REDIS_URL=redis://your-production-redis-uri
JWT_SECRET=your-production-jwt-secret
OPENAI_API_KEY=your-openai-api-key
```

### Docker Deployment:
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🆘 Troubleshooting

### Common Issues:

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running: `sudo systemctl status mongodb`
   - Check connection string in `.env`
   - Verify MongoDB is accessible on port 27017

2. **Redis Connection Failed**
   - Redis is optional, the app will work without it
   - Install Redis: `sudo apt install redis-server`
   - Start Redis: `sudo systemctl start redis`

3. **Port Already in Use**
   - Change PORT in `.env` file
   - Or kill existing process: `sudo lsof -ti:3000 | xargs kill -9`

4. **Dependencies Installation Failed**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall: `npm install`

### Getting Help:
- Check logs in `logs/` directory
- Verify environment variables in `.env`
- Test individual components using the health check
- Review the README.md for detailed documentation

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] MongoDB running (optional)
- [ ] Database setup completed (`npm run db:setup`)
- [ ] Sample data seeded (`npm run db:seed`)
- [ ] Application started (`npm start`)
- [ ] Web interface accessible (http://localhost:3000)
- [ ] API endpoints working (health check)
- [ ] Chat functionality tested
- [ ] Property search working

## 🎉 Success!

Your premium real estate chatbot is now fully operational with:
- ✅ Beautiful web interface
- ✅ Real-time chat functionality
- ✅ Sample property database
- ✅ Advanced search capabilities
- ✅ Production-ready security
- ✅ Comprehensive monitoring

**Ready to help clients find their dream properties in Bangalore!** 🏠✨ 