import { asyncHandler } from "../utils/asyncHandler.js";
import { APIerror } from "../utils/APIerror.js";
import { APIresponse } from "../utils/APIresponse.js";


import axios from 'axios';

class DialogflowController {
  constructor() {
    this.projectId = process.env.GOOGLE_PROJECT_ID;
    this.privateKey = process.env.DIALOGFLOW_PRIVATE_KEY;
    this.clientEmail = process.env.DIALOGFLOW_CLIENT_EMAIL;
    
   
    this.fallbackResponses = {
      "hello": "Hello! I'm your Castify assistant. How can I help you today?",
      "help": "I can help you with information about uploading videos, premium features, contact details, platform features, signing up, our mission, and navigation.",
      "upload": "To upload videos on Castify, you need to sign up first, then go to the Creator Tools section.",
      "features": "Castify offers Creative Tools, Secure Platform, Analytics Dashboard, Community features, and more!",
      "contact": "You can reach us at hello@castify.com or use our contact form.",
      "pricing": "We offer both free and premium plans. Premium includes advanced analytics and priority support.",
      "default": "I can help you with questions about uploading videos, premium features, contact information, and platform features. What would you like to know?"
    };
  }

 
  detectUserIntent(query) {
    const normalizedQuery = query.toLowerCase().trim();
    
    // Intent patterns
    const intentPatterns = {
      'greeting': ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'greetings'],
      'help': ['help', 'assist', 'support', 'what can you do'],
      'upload': ['upload', 'share video', 'post video', 'add video', 'publish'],
      'features': ['features', 'what does', 'capabilities', 'functions', 'tools'],
      'pricing': ['price', 'cost', 'premium', 'subscription', 'plan', 'fee'],
      'contact': ['contact', 'reach', 'email', 'phone', 'support team'],
      'navigation': ['how to', 'where', 'find', 'navigate', 'go to'],
      'analytics': ['analytics', 'stats', 'metrics', 'performance', 'insights'],
      'community': ['community', 'creators', 'connect', 'network', 'collaborate'],
      'security': ['security', 'safe', 'privacy', 'protect', 'encryption']
    };

    // Find matching intent
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => normalizedQuery.includes(pattern))) {
        return {
          intent,
          confidence: 0.8,
          parameters: this.extractParameters(normalizedQuery, intent)
        };
      }
    }

    return {
      intent: 'default.fallback',
      confidence: 0.3,
      parameters: {}
    };
  }


  extractParameters(query, intent) {
    const parameters = {};
    
    // Extract common parameters based on intent
    switch (intent) {
      case 'upload':
        if (query.includes('video')) parameters.media_type = 'video';
        if (query.includes('image')) parameters.media_type = 'image';
        break;
      case 'pricing':
        if (query.includes('premium')) parameters.plan_type = 'premium';
        if (query.includes('free')) parameters.plan_type = 'free';
        break;
      case 'features':
        if (query.includes('analytics')) parameters.feature = 'analytics';
        if (query.includes('security')) parameters.feature = 'security';
        break;
    }
    
    return parameters;
  }


  generateSmartResponse(intent, parameters, query) {
    const responses = {
      'greeting': [
        "Hello! I'm your Castify assistant. I can help you with uploading videos, exploring features, or answering questions about our platform. What would you like to know?",
        "Hi there! Welcome to Castify! I'm here to help you navigate our platform and answer any questions you might have.",
        "Hey! Great to see you on Castify! How can I assist you today?"
      ],
      'help': [
        "I can help you with: 📹 Uploading videos, ⭐ Platform features, 💰 Pricing information, 📞 Contact details, 🚀 Getting started, and 📊 Analytics. What interests you most?",
        "I'm here to assist with all things Castify! Ask me about video uploads, premium features, community guidelines, or anything else you'd like to know."
      ],
      'upload': [
        "To upload videos: 1️⃣ Sign up for an account, 2️⃣ Go to Creator Tools, 3️⃣ Click 'Upload Videos', 4️⃣ Select your video file, 5️⃣ Add title and description, 6️⃣ Publish! 🎬",
        "Ready to share your content? After signing up, head to the Creator Tools section and click 'Upload Videos'. We support MP4 format up to 100MB for the best experience!"
      ],
      'features': [
        "Castify offers amazing features: 🎨 Creative editing tools, 🛡️ Enterprise-level security, 📊 Advanced analytics, 👥 Community networking, 💰 Monetization options, and ⚡ lightning-fast performance!",
        "Our platform includes professional editing tools, secure hosting, detailed analytics, community features, and monetization opportunities. Which feature would you like to know more about?"
      ],
      'pricing': [
        "We offer flexible pricing: 🆓 Free plan with basic features, ⭐ Premium plans with advanced analytics, priority support, unlimited uploads, and exclusive tools. Check our pricing section for details!",
        "Choose the plan that fits you: Free for getting started, Premium for advanced creators. Premium includes analytics, priority support, and exclusive features!"
      ],
      'contact': [
        "Reach us easily: 📧 hello@castify.com or support@castify.com, 📞 +1 (555) 123-4567, 🏢 123 Innovation Street, San Francisco. Or use our contact form below!",
        "We're here to help! Email us, call our support line, or visit our office. You can also use the contact form in the 'Get In Touch' section."
      ],
      'analytics': [
        "Our Analytics Dashboard provides comprehensive insights: 📈 Video performance metrics, 👥 Audience engagement data, 🎯 Content optimization tips, and 💰 Revenue tracking. Available in Premium plans!",
        "Track your success with detailed analytics! Monitor views, engagement, audience demographics, and performance trends to optimize your content strategy."
      ],
      'community': [
        "Join our vibrant creator community! 🤝 Connect with like-minded creators, 💡 Share tips and collaborate, 🎉 Join virtual meetups, and 🚀 Grow together. Sign up to start networking!",
        "Our community is amazing! Network with fellow creators, join collaborative projects, attend virtual events, and build meaningful relationships. Welcome aboard!"
      ],
      'security': [
        "Your security is our priority! 🔐 Enterprise-level encryption, 🛡️ Secure data storage, 🔒 Privacy protection, and 📊 Transparent data handling. Your content and personal information are safe with us!",
        "We take security seriously: advanced encryption, secure hosting, privacy protection, and strict data policies ensure your content and information are completely safe."
      ],
      'navigation': [
        "Navigate Castify easily: 🏠 Homepage for overview, 📹 Creator Tools for uploads, 👥 Community for networking, 💰 Pricing for plans, and 📞 Contact for support. What are you looking for?",
        "Finding your way around? Use the main navigation menu, check out our Creator Tools section, explore the Community area, or scroll down to see all features!"
      ]
    };

    const intentResponses = responses[intent] || responses['default'] || [
      "I can help you with questions about uploading videos, premium features, contact information, platform features, signing up, our mission, and navigation. Could you please be more specific?"
    ];

    // Add parameter-based customization
    let response = intentResponses[Math.floor(Math.random() * intentResponses.length)];
    
    // Customize based on parameters
    if (parameters.media_type === 'video' && intent === 'upload') {
      response += " 💡 Pro tip: Use MP4 format for best compatibility!";
    }
    
    if (parameters.plan_type === 'premium' && intent === 'pricing') {
      response += " 🌟 Premium members get exclusive beta access too!";
    }

    return response;
  }
}

const dialogflowController = new DialogflowController();


const detectIntent = asyncHandler(async (req, res) => {
  const { query, sessionId, languageCode = 'en-US' } = req.body;

  if (!query || !sessionId) {
    throw new APIerror(400, "Query and sessionId are required");
  }

  try {
    // Use our enhanced intent detection
    const intentResult = dialogflowController.detectUserIntent(query);
    
    // Generate smart response
    const fulfillmentText = dialogflowController.generateSmartResponse(
      intentResult.intent,
      intentResult.parameters,
      query
    );

    const response = {
      fulfillmentText,
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      parameters: intentResult.parameters,
      sessionId,
      languageCode,
      queryText: query
    };

    console.log(`💬 Chatbot Query: "${query}" -> Intent: ${intentResult.intent} (${intentResult.confidence})`);

    return res.status(200).json(
      new APIresponse(200, response, "Intent detected successfully")
    );

  } catch (error) {
    console.error("Dialogflow error:", error);
    
    // Fallback response
    const fallbackResponse = {
      fulfillmentText: "I'm sorry, I'm having trouble understanding right now. Please try asking about our features, how to upload videos, pricing, or contact information.",
      intent: "default.fallback",
      confidence: 0.1,
      parameters: {},
      sessionId,
      languageCode,
      queryText: query
    };

    return res.status(200).json(
      new APIresponse(200, fallbackResponse, "Fallback response generated")
    );
  }
});


const healthCheck = asyncHandler(async (req, res) => {
  const isConfigured = !!(
    dialogflowController.projectId &&
    dialogflowController.privateKey &&
    dialogflowController.clientEmail
  );

  return res.status(200).json(
    new APIresponse(200, {
      status: "healthy",
      dialogflowConfigured: isConfigured,
      timestamp: new Date().toISOString()
    }, "Dialogflow service is healthy")
  );
});

export {
  detectIntent,
  healthCheck
};
