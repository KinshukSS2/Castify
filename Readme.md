<!-- this is a project for backend based project -->

# 🎬 Castify - Interactive Video Storytelling Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white" alt="JWT" />
</div>

## 🌟 Overview

**Castify** is a revolutionary full-stack interactive video storytelling platform that empowers creators to build branching narrative experiences. Combining the engagement of streaming platforms with the interactivity of choose-your-own-adventure stories, Castify features an integrated e-commerce marketplace for merchandise sales.

## ✨ Key Features

### 🎯 Core Functionality

- **Interactive Story Creation**: Build branching video narratives with multiple choice paths
- **Video Upload & Management**: Seamless video hosting with Cloudinary integration
- **User Authentication**: Secure JWT-based login system with refresh tokens
- **Story Tree Visualization**: Navigate complex branching storylines with intuitive UI
- **Voting & Engagement**: Community-driven content rating system

### 🛒 E-commerce Integration

- **Merchandise Store**: Complete shopping cart and checkout system
- **Indian Market Localization**: Rupee (₹) currency with 85x USD conversion
- **Pincode-based Shipping**: Smart shipping cost calculation for Indian postal codes
- **Multi-step Checkout**: Streamlined purchase flow with order management

### 🎨 User Experience

- **Modern Responsive Design**: Beautiful UI with floating animations and gradients
- **Progressive Web App Ready**: Mobile-optimized experience
- **Intelligent Chatbot**: AI-powered customer support system
- **Real-time Analytics**: Content performance tracking and insights

## 🏗️ Architecture

### Frontend (React.js)

```
src/
├── components/
│   ├── AllVideos.jsx          # Video gallery and management
│   ├── CreateStory.jsx        # Story creation interface
│   ├── StoryViewer.jsx        # Interactive story player
│   ├── Home.jsx               # Dashboard with recent content
│   ├── Profile.jsx            # User profile management
│   ├── Login.jsx & register.jsx # Authentication forms
│   ├── Merchandise.jsx        # E-commerce product catalog
│   ├── Checkout.jsx           # Multi-step purchase flow
│   └── api/
│       ├── axiosInstance.jsx  # API configuration
│       └── storyApi.jsx       # Story-specific endpoints
```

### Backend (Node.js/Express)

```
src/
├── controllers/
│   ├── user.controller.js     # Authentication & user management
│   ├── video.controller.js    # Video upload & streaming
│   ├── story.controller.js    # Story creation & tree management
│   └── subscription.controller.js # User subscriptions
├── models/
│   ├── user.model.js          # User schema with JWT methods
│   ├── video.model.js         # Video metadata & branching
│   ├── story.model.js         # Story structure definition
│   └── order.model.js         # E-commerce order management
├── routes/                    # API endpoint definitions
├── middlewares/               # Authentication & file upload
└── utils/                     # Helper functions & API responses
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB Atlas account
- Cloudinary account for media storage

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/castify.git
   cd castify
   ```

2. **Backend Setup**

   ```bash
   cd CHAI_BACKEND
   npm install

   # Copy and configure environment variables
   cp env.sample .env
   # Edit .env with your MongoDB URI, Cloudinary credentials, and JWT secrets

   # Start development server
   npm run dev
   ```

3. **Frontend Setup**

   ```bash
   cd ../Chais_FRONTEND/FULL_FRONTEND
   npm install

   # Start development server
   npm run dev
   ```

4. **Environment Configuration**

   ```env
   # Backend (.env)
   PORT=8000
   MONGODB_URI=your_mongodb_connection_string
   CORS_ORIGIN=http://localhost:5173

   ACCESS_TOKEN_SECRET=your_jwt_access_secret
   ACCESS_TOKEN_EXPIRY=1d
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
   REFRESH_TOKEN_EXPIRY=10d

   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## 📊 API Documentation

### Authentication Endpoints

```javascript
POST /api/v1/users/register    # User registration with file upload
POST /api/v1/users/login       # User authentication
POST /api/v1/users/logout      # Secure logout
POST /api/v1/users/refresh-token # Token refresh
```

### Story Management

```javascript
POST /api/v1/stories/create           # Create new story
GET  /api/v1/stories/                 # List all stories
GET  /api/v1/stories/:id              # Get story details
GET  /api/v1/stories/:id/full         # Get complete story tree
POST /api/v1/stories/:videoId/branch  # Add branch to video
POST /api/v1/stories/:videoId/vote    # Vote on video content
```

### Video Operations

```javascript
POST /api/v1/videos/upload           # Upload video with metadata
GET  /api/v1/videos/getAll-videos    # Paginated video list
GET  /api/v1/videos/getMyVideos      # User's uploaded videos
```

## 🛍️ E-commerce Features

### Shopping Experience

- **Product Catalog**: Merchandise with multiple variants (size, color)
- **Smart Cart**: Persistent shopping cart with quantity management
- **Shipping Calculator**: Pincode-based delivery cost estimation
- **Order Processing**: Complete checkout flow with payment simulation

### Pricing & Localization

- **Currency**: Indian Rupees (₹) with automatic USD conversion
- **Shipping**: Free shipping over ₹4,250, standard rate ₹849.15
- **Tax Calculation**: 8% GST included in final pricing

## 🎮 Interactive Story System

### Branching Narratives

- **Root Video**: Starting point of every story
- **Dynamic Branches**: Multiple choice paths based on user decisions
- **Vote-based Popularity**: Community voting influences auto-play selection
- **Fullscreen Mode**: Immersive viewing experience with auto-progression

### Story Creation Workflow

1. **Upload Videos**: Add content to personal library
2. **Create Story**: Select root video and add metadata
3. **Build Branches**: Connect videos to create decision trees
4. **Community Engagement**: Users vote on preferred story paths

## 🔐 Security Features

- **JWT Authentication**: Secure token-based user sessions
- **Password Hashing**: bcrypt encryption for user passwords
- **File Upload Security**: Multer middleware with type validation
- **CORS Protection**: Configured cross-origin resource sharing
- **Input Validation**: Comprehensive data sanitization

## 🌐 Technology Stack

### Frontend Technologies

- **React 18**: Modern component-based UI framework
- **React Router**: Client-side routing and navigation
- **Axios**: HTTP client with interceptors for API calls
- **Vite**: Fast build tool and development server
- **CSS3**: Custom animations and responsive design

### Backend Technologies

- **Express.js**: RESTful API framework
- **MongoDB**: NoSQL database with Mongoose ODM
- **Cloudinary**: Cloud-based media management
- **JWT**: JSON Web Token authentication
- **Multer**: File upload middleware

### Development Tools

- **Nodemon**: Auto-restart development server
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Git**: Version control system

## 📱 Mobile & PWA Ready

- **Responsive Design**: Optimized for all screen sizes
- **Touch Interactions**: Mobile-friendly gesture support
- **Offline Capability**: Service worker implementation ready
- **App-like Experience**: PWA manifest configuration

## 🤖 AI & Chatbot Integration

- **Intelligent Support**: Context-aware customer assistance
- **Natural Language Processing**: Understanding user queries
- **Predefined Responses**: Quick answers to common questions
- **Google Technology Ready**: Prepared for Dialogflow integration

## 📈 Analytics & Insights

- **User Engagement**: Video views and story completion rates
- **Content Performance**: Vote tracking and popularity metrics
- **Revenue Analytics**: E-commerce sales and conversion data
- **User Behavior**: Navigation patterns and interaction heatmaps

## 🔮 Future Enhancements

### Planned Features

- **Google OAuth Integration**: Single sign-on capability
- **Advanced Analytics**: Google Analytics 4 integration
- **Cloud Storage Migration**: Google Cloud Storage implementation
- **AI-Powered Recommendations**: Machine learning content suggestions
- **Real-time Chat**: Live community interaction features
- **Mobile Apps**: Native iOS and Android applications

### Google Technology Integration

- **Dialogflow**: Enhanced chatbot capabilities
- **Google Cloud AI**: Content moderation and analysis
- **YouTube API**: Extended video platform integration
- **Google Pay**: Seamless payment processing

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow React and Node.js best practices
- Maintain consistent code formatting
- Add comprehensive tests for new features
- Update documentation for API changes

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Kinshuk Sanand**

- GitHub: [@KinshukSS2](https://github.com/KinshukSS2)
- Email: kinshuklit2005@gmail.com

## 🙏 Acknowledgments

- **Chai aur Code**: Inspiration and learning platform
- **React Community**: Excellent documentation and support
- **MongoDB**: Robust database solutions
- **Cloudinary**: Reliable media management
- **Express.js**: Flexible web framework

## 📞 Support

For support and questions:

- 📧 Email: support@castify.com
- 📱 Phone: +1 (555) 123-4567
- 🌐 Website: [castify.com](https://castify.com)

---

<div align="center">
  <p>Made with ❤️ by the Castify Team</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
