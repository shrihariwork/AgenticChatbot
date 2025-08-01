const OpenAI = require('openai');
const { Chat } = require('../models/Chat');
const { Property } = require('../models/Property');
const { logger } = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

class ChatbotService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.systemPrompt = `You are a knowledgeable, warm, and helpful premium real estate consultant for a luxury real estate company in Bangalore, India. 

Your personality traits:
- Knowledgeable: You have deep expertise in Bangalore's real estate market, property trends, and investment opportunities
- Warm: You're friendly, approachable, and genuinely care about helping clients find their perfect property
- Helpful: You go above and beyond to provide valuable insights, recommendations, and guidance

Your expertise includes:
- Premium residential properties (apartments, villas, luxury homes)
- Commercial properties (offices, retail spaces, warehouses)
- Investment opportunities and market trends
- Property valuation and pricing insights
- Location analysis and neighborhood information
- Legal and documentation guidance
- Financing options and recommendations

Key areas in Bangalore you're familiar with:
- Central Bangalore: MG Road, Indiranagar, Koramangala, Jayanagar
- North Bangalore: Hebbal, Yelahanka, Devanahalli, Bellary Road
- South Bangalore: Electronic City, Sarjapur, Whitefield, Marathahalli
- East Bangalore: KR Puram, Hoskote, Varthur
- West Bangalore: Rajajinagar, Vijayanagar, Kengeri

Always provide:
- Specific property recommendations based on requirements
- Market insights and trends
- Location benefits and amenities
- Pricing guidance and investment potential
- Next steps and contact information

Keep responses conversational, natural, and rich with relevant information. Use markdown formatting when appropriate for better readability.`;

    this.conversationStages = {
      greeting: 'greeting',
      requirements: 'requirements',
      property_search: 'property_search',
      property_details: 'property_details',
      contact_info: 'contact_info',
      follow_up: 'follow_up'
    };
  }

  async processMessage(sessionId, userId, userMessage, context = {}) {
    try {
      // Get or create chat session
      let chat = await Chat.findOne({ sessionId });
      if (!chat) {
        chat = new Chat({
          sessionId,
          userId,
          context: {
            ...context,
            conversationStage: this.conversationStages.greeting
          }
        });
      }

      // Add user message to chat
      await chat.addMessage('user', userMessage);

      // Analyze user intent and extract entities
      const analysis = await this.analyzeUserIntent(userMessage, chat.context);
      
      // Update chat context
      await chat.updateContext({
        lastIntent: analysis.intent,
        conversationStage: analysis.nextStage || chat.context.conversationStage
      });

      // Generate response based on intent and stage
      const response = await this.generateResponse(userMessage, chat, analysis);

      // Add assistant response to chat
      await chat.addMessage('assistant', response.content, {
        intent: analysis.intent,
        confidence: analysis.confidence,
        entities: analysis.entities,
        suggestedActions: response.suggestedActions
      });

      return {
        response: response.content,
        suggestedActions: response.suggestedActions,
        context: chat.context,
        sessionId: chat.sessionId
      };

    } catch (error) {
      logger.error('Error processing message:', error);
      return {
        response: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment, or feel free to contact our team directly for immediate assistance.",
        suggestedActions: [
          { type: 'contact', label: 'Contact Support', value: 'support' }
        ]
      };
    }
  }

  async analyzeUserIntent(message, context) {
    try {
      const prompt = `
Analyze the following user message for a real estate chatbot in Bangalore, India.

User message: "${message}"

Current conversation context: ${JSON.stringify(context)}

Please identify:
1. Primary intent (greeting, property_search, property_details, contact_request, general_inquiry, etc.)
2. Confidence score (0-1)
3. Extracted entities (property_type, location, budget, bedrooms, etc.)
4. Next conversation stage

Respond in JSON format:
{
  "intent": "string",
  "confidence": number,
  "entities": [{"type": "string", "value": "string", "confidence": number}],
  "nextStage": "string"
}
`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an intent analysis expert for real estate conversations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      return analysis;

    } catch (error) {
      logger.error('Error analyzing intent:', error);
      return {
        intent: 'general_inquiry',
        confidence: 0.5,
        entities: [],
        nextStage: context.conversationStage
      };
    }
  }

  async generateResponse(userMessage, chat, analysis) {
    try {
      let systemPrompt = this.systemPrompt;
      
      // Add context-specific information
      if (analysis.intent === 'property_search') {
        const properties = await this.searchProperties(analysis.entities);
        systemPrompt += `\n\nAvailable properties matching user requirements: ${JSON.stringify(properties.slice(0, 3))}`;
      }

      const messages = [
        { role: "system", content: systemPrompt },
        ...chat.messages.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: userMessage }
      ];

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages,
        temperature: 0.7,
        max_tokens: 1000
      });

      const response = completion.choices[0].message.content;
      const suggestedActions = this.generateSuggestedActions(analysis.intent, chat.context);

      return {
        content: response,
        suggestedActions
      };

    } catch (error) {
      logger.error('Error generating response:', error);
      return {
        content: "I'm here to help you find your perfect property in Bangalore. Could you tell me more about what you're looking for?",
        suggestedActions: [
          { type: 'property_search', label: 'Search Properties', value: 'search' },
          { type: 'contact', label: 'Contact Agent', value: 'contact' }
        ]
      };
    }
  }

  async searchProperties(entities) {
    try {
      const query = {};
      
      // Build query based on extracted entities
      if (entities.find(e => e.type === 'property_type')) {
        const propertyType = entities.find(e => e.type === 'property_type').value;
        query.type = propertyType;
      }

      if (entities.find(e => e.type === 'location')) {
        const location = entities.find(e => e.type === 'location').value;
        query['location.area'] = { $regex: location, $options: 'i' };
      }

      if (entities.find(e => e.type === 'budget')) {
        const budget = entities.find(e => e.type === 'budget').value;
        // Parse budget range and add to query
        query['price.amount'] = { $lte: budget };
      }

      if (entities.find(e => e.type === 'bedrooms')) {
        const bedrooms = entities.find(e => e.type === 'bedrooms').value;
        query['specifications.bedrooms'] = { $gte: parseInt(bedrooms) };
      }

      query.status = 'available';
      query.featured = true; // Prioritize featured properties

      const properties = await Property.find(query)
        .limit(10)
        .sort({ featured: -1, createdAt: -1 });

      return properties;

    } catch (error) {
      logger.error('Error searching properties:', error);
      return [];
    }
  }

  generateSuggestedActions(intent, context) {
    const actions = [];

    switch (intent) {
      case 'greeting':
        actions.push(
          { type: 'property_search', label: 'Search Properties', value: 'search' },
          { type: 'contact', label: 'Contact Agent', value: 'contact' },
          { type: 'market_info', label: 'Market Trends', value: 'trends' }
        );
        break;

      case 'property_search':
        actions.push(
          { type: 'property_details', label: 'View Details', value: 'details' },
          { type: 'schedule_visit', label: 'Schedule Visit', value: 'visit' },
          { type: 'contact', label: 'Contact Agent', value: 'contact' }
        );
        break;

      case 'property_details':
        actions.push(
          { type: 'schedule_visit', label: 'Schedule Visit', value: 'visit' },
          { type: 'contact', label: 'Contact Agent', value: 'contact' },
          { type: 'similar_properties', label: 'Similar Properties', value: 'similar' }
        );
        break;

      default:
        actions.push(
          { type: 'property_search', label: 'Search Properties', value: 'search' },
          { type: 'contact', label: 'Contact Agent', value: 'contact' }
        );
    }

    return actions;
  }

  async getPropertyRecommendations(userPreferences) {
    try {
      const query = {
        status: 'available',
        featured: true
      };

      if (userPreferences.propertyType && userPreferences.propertyType.length > 0) {
        query.type = { $in: userPreferences.propertyType };
      }

      if (userPreferences.budget) {
        query['price.amount'] = {
          $gte: userPreferences.budget.min || 0,
          $lte: userPreferences.budget.max || Number.MAX_SAFE_INTEGER
        };
      }

      if (userPreferences.location && userPreferences.location.length > 0) {
        query['location.area'] = { $in: userPreferences.location };
      }

      if (userPreferences.bedrooms) {
        query['specifications.bedrooms'] = {
          $gte: userPreferences.bedrooms.min || 0,
          $lte: userPreferences.bedrooms.max || 10
        };
      }

      const properties = await Property.find(query)
        .limit(5)
        .sort({ featured: -1, createdAt: -1 });

      return properties;

    } catch (error) {
      logger.error('Error getting property recommendations:', error);
      return [];
    }
  }

  async getMarketInsights() {
    try {
      // This would typically integrate with external market data APIs
      // For now, returning static insights
      return {
        trends: [
          "Bangalore's real estate market is showing strong growth in tech corridors",
          "Premium properties in central Bangalore are in high demand",
          "Investment opportunities are emerging in upcoming areas like Whitefield and Electronic City"
        ],
        hotspots: [
          "Indiranagar - Premium residential area with excellent connectivity",
          "Koramangala - Tech hub with modern apartments and commercial spaces",
          "Whitefield - Fast-growing area with luxury villas and apartments"
        ],
        priceTrends: {
          residential: "+8% YoY",
          commercial: "+12% YoY",
          luxury: "+15% YoY"
        }
      };
    } catch (error) {
      logger.error('Error getting market insights:', error);
      return {};
    }
  }
}

module.exports = new ChatbotService(); 