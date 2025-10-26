# InsureChat VN - AI-Powered Insurance Analysis Platform

![InsureChat VN](https://img.shields.io/badge/InsureChat-VN-blue)
![React](https://img.shields.io/badge/React-18.0+-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6)
![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF)

## 📋 Overview

InsureChat VN is an intelligent insurance analysis platform that leverages a multi-agent AI system to provide comprehensive insurance recommendations, market analysis, and personalized advice for Vietnamese users. The platform combines data analysis, market research, and AI-powered insights to help users make informed insurance decisions.

## ✨ Key Features

### 🤖 Multi-Agent AI System
- **Agent 1 - Data Analyst (NLU)**: Analyzes user queries and extracts structured information
- **Agent 2 - Process Optimizer**: Searches and compares market prices from multiple insurance providers
- **Agent 3 - Additional Analyst**: Provides supplementary product analysis and recommendations
- **Agent 4 - Quality Assurance**: Performs web market research and quality validation
- **Agent 5 - Report Writer**: Generates comprehensive reports with pricing recommendations

### 💬 Interactive Chat Interface
- Real-time conversation with AI agents
- Step-by-step approval workflow for each agent
- Feedback system for agent refinement
- Rich markdown rendering for reports and analysis

### 📊 Comprehensive Analysis
- Market price comparison tables
- Insurance product recommendations
- Pricing evaluation and suggestions
- Detailed rationale for recommendations
- Report generation (HTML, Markdown, PDF)

### 🔐 User Management
- Supabase authentication
- User session management
- Document upload and management
- Source file organization

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **React Router** - Client-side routing
- **React Markdown** - Markdown rendering

### Backend & Services
- **Supabase** - Authentication and database
- **Flask Multi-Agent API** - AI processing backend
- **Cloudflare Tunnels** - API proxy and CORS handling

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Lovable** - AI-powered development platform

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd insurechat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_BASE_URL=https://your-flask-api-url.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080`

## 📁 Project Structure

```
insurechat/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ComparisonTable.tsx
│   │   ├── RecommendationCards.tsx
│   │   └── FileUploadDialog.tsx
│   ├── pages/              # Application pages
│   │   ├── Auth.tsx        # Authentication page
│   │   ├── Chat.tsx        # Main chat interface
│   │   ├── Index.tsx       # Landing page
│   │   └── NotFound.tsx    # 404 page
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # External service integrations
│   │   └── supabase/       # Supabase client and types
│   ├── lib/                # Utility functions
│   └── main.tsx           # Application entry point
├── supabase/               # Supabase configuration
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── docs/                   # Documentation
```

## 🔧 Configuration

### Vite Proxy Configuration
The project uses Vite's proxy feature to handle CORS issues with the Flask API:

```typescript
// vite.config.ts
proxy: {
  '/api/flask': {
    target: 'https://your-flask-api-url.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/flask/, ''),
  }
}
```

### Supabase Setup
1. Create a new Supabase project
2. Set up authentication providers
3. Create the required database tables:
   - `sources` - for document management
   - `conversations` - for chat history
4. Configure RLS policies

## 🤖 Multi-Agent Workflow

### Agent Processing Flow
1. **User Input** → Agent 1 (Data Analysis)
2. **Agent 1 Approval** → Agent 2 (Market Search)
3. **Agent 2 Completion** → Agent 3 (Additional Analysis)
4. **Agent 3 Completion** → Agent 4 (Quality Assurance)
5. **Agent 4 Completion** → Agent 5 (Report Generation)
6. **Agent 5 Approval** → Complete Analysis

### Agent Output Formats
Each agent returns structured JSON data:
- **Agent 1**: Customer profile, policy type, confidence score
- **Agent 2**: Market prices, product comparisons
- **Agent 3**: Additional product recommendations
- **Agent 4**: Web market insights, quality validation
- **Agent 5**: Final report with pricing recommendations

## 📱 Usage

### For Users
1. **Sign Up/Login** - Create an account or sign in
2. **Upload Documents** - Add insurance documents for analysis
3. **Ask Questions** - Chat with the AI about insurance options
4. **Review Analysis** - Approve each agent's analysis step by step
5. **Get Recommendations** - Receive comprehensive insurance recommendations

### For Developers
1. **Agent Integration** - Add new agents to the workflow
2. **UI Components** - Extend the component library
3. **API Integration** - Connect additional data sources
4. **Customization** - Modify the analysis workflow

## 🔒 Security Features

- **Authentication**: Secure user authentication via Supabase
- **CORS Protection**: Proper CORS handling for API calls
- **Data Validation**: Input validation and sanitization
- **Error Handling**: Comprehensive error handling and logging

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Static site deployment
- **Railway**: Full-stack deployment
- **Docker**: Containerized deployment

## 📊 Performance

- **Fast Loading**: Vite's optimized build process
- **Code Splitting**: Automatic code splitting for better performance
- **Lazy Loading**: Components loaded on demand
- **Caching**: Efficient caching strategies

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Join community discussions in GitHub Discussions

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Mobile app development
- [ ] Integration with more insurance providers
- [ ] AI model fine-tuning
- [ ] Real-time notifications
- [ ] Advanced reporting features

## 🙏 Acknowledgments

- **Lovable** - AI-powered development platform
- **Supabase** - Backend-as-a-Service
- **shadcn/ui** - Beautiful UI components
- **Vite** - Fast build tool
- **React** - UI library

---

**Made with ❤️ for the Vietnamese insurance market**