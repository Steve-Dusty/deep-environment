# 🌍 Deep Environment

**An immersive environmental monitoring dashboard with AI-powered voice control, 3D knowledge graphs, and interactive storytelling.**

Deep Environment transforms environmental data into an interactive experience where users can explore global pollution hotspots, monitor real-time threats, and understand complex ecological relationships through voice commands, 3D visualizations, and narrative-driven simulations.

---

## 🎯 What Does It Do?

Deep Environment provides:

1. **🗺️ Interactive Global Map** - Monitor 16+ environmental hotspots worldwide with real-time pin updates
2. **🎤 Voice Control** - 60+ voice commands + AI-powered natural language interpretation (say "Hey Deep")
3. **🕸️ 3D Knowledge Graphs** - Visualize threat correlations and environmental relationships in force-directed 3D networks
4. **📸 Community Reports** - Slack integration for community photo uploads with automatic classification
5. **🌌 Immersive Storytelling** - Odyssey.ml powered narrative experiences with branching decision trees
6. **💬 AI Chatbot** - Ask questions about environmental data and generate PDF reports
7. **📊 PDF Generation** - Export location reports and knowledge graph visualizations
8. **🔊 Text-to-Speech** - Voice responses using ElevenLabs for all interactions

---

## 🛠️ Technologies Used

### **Frontend**
- **[Next.js 15.1](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript 5.7](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4.0](https://tailwindcss.com/)** - Styling
- **[Lucide React](https://lucide.dev/)** - Icon library

### **Data Visualization**
- **[Mapbox GL 3.9](https://www.mapbox.com/)** - Interactive maps
- **[Three.js 0.182](https://threejs.org/)** - 3D graphics engine
- **[react-force-graph-3d](https://github.com/vasturiano/react-force-graph-3d)** - Force-directed 3D graphs

### **AI & Voice**
- **[OpenAI API](https://openai.com/)** (GPT-4o-mini) - Voice interpretation, graph analysis, chatbot
- **[ElevenLabs](https://elevenlabs.io/)** - Text-to-speech (Daniel voice)
- **Web Speech API** - Browser-native speech recognition

### **Immersive Experience**
- **[Odyssey.ml](https://odyssey.ml/)** - Interactive narrative visualizations and world models

### **Backend & Utilities**
- **[PDFKit](https://pdfkit.org/)** - PDF report generation
- **[Composio](https://composio.dev/)** - Slack bot integration

### **Project Structure**
```
src/
├── app/                    # Backend (Next.js App Router)
│   ├── api/               # API routes
│   │   ├── ai/           # OpenAI integration
│   │   ├── tts/          # Text-to-speech
│   │   ├── narrate/      # Documentary narration
│   │   ├── generate-pdf/ # PDF generation
│   │   ├── generate-posters/
│   │   └── slack-uploads/
│   ├── landing/          # Landing page
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # Root layout
│
├── components/            # Frontend React components
│   ├── MapView.tsx
│   ├── KnowledgeGraph3D.tsx
│   ├── LocationGraph3D.tsx
│   ├── OdysseyView.tsx
│   ├── ChatView.tsx
│   ├── LeftSidebar.tsx
│   └── [15+ other components]
│
├── hooks/                 # Custom React hooks
│   ├── useVoiceControl.ts  # Speech recognition
│   ├── useTTS.ts           # Text-to-speech
│   └── VoiceIndicator.tsx
│
└── data/                  # Data models & AI logic
    ├── locations.ts       # Pin reports & location data
    ├── locationGraphs.ts  # Knowledge graph structures
    ├── ai.ts              # OpenAI integration
    ├── globalAI.ts
    └── locationAI.ts
```

---

## 🚀 Getting Started

### **Prerequisites**

- **Node.js 18+** and npm
- **API Keys** (see below)

### **Required API Keys**

Create a `.env.local` file in the root directory:

```bash
# OpenAI API Key (for voice interpretation, chatbot, PDF narration)
OPENAI_API_KEY=sk-proj-your-key-here

# ElevenLabs API Key (for text-to-speech responses)
ELEVENLABS_API_KEY=your-elevenlabs-key-here

# Mapbox API Key (for interactive maps)
NEXT_PUBLIC_MAPBOX_API_KEY=pk.your-mapbox-token-here
```

#### **Where to Get API Keys:**

1. **OpenAI**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
   - Sign up and create an API key
   - Requires billing setup (pay-as-you-go)

2. **ElevenLabs**: [https://elevenlabs.io/](https://elevenlabs.io/)
   - Free tier available (10,000 characters/month)
   - Get API key from Settings

3. **Mapbox**: [https://www.mapbox.com/](https://www.mapbox.com/)
   - Free tier available (50,000 map loads/month)
   - Create a token from your account dashboard

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/Steve-Dusty/deep-environment.git
cd deep-environment

# Install dependencies
npm install --legacy-peer-deps

# Create environment file
cp .env.example .env.local
# Then edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎤 Voice Commands

Say **"Hey Deep"** followed by any command:

### **Navigation**
- "Show the map"
- "Go to Amazon"
- "Navigate to Beijing"
- "Show knowledge graph"

### **Filtering**
- "Filter category water"
- "Show only critical threats"
- "Filter air pollution"

### **Overlays**
- "Enable satellite view"
- "Turn on heat map"
- "Disable weather layer"

### **Information**
- "How many agents are active?"
- "Describe this location"
- "What's the severity?"

### **Natural Language (AI-powered)**
- "I want to see ocean pollution"
- "Show me the worst threats"
- "Tell me about deforestation"

---

## 🌐 Features Walkthrough

### 1. **Global Dashboard**
- Interactive Mapbox map with 16+ environmental hotspots
- Color-coded pins by severity (green → red)
- Real-time agent monitoring

### 2. **3D Knowledge Graphs**
- Force-directed node networks showing threat relationships
- Click nodes to explore connections
- Zoom, pan, and rotate in 3D space

### 3. **Location Details**
- Detailed metrics per location
- Historical trends
- Correlated threats
- AI-generated insights

### 4. **Odyssey Narratives**
- Interactive decision trees for each category (Water, Air, Bio, etc.)
- Branching storylines with environmental consequences
- Immersive visualizations

### 5. **Voice Control**
- Hands-free navigation
- AI interprets complex natural language
- Text-to-speech feedback

### 6. **Slack Integration**
- Community uploads photos via Slack
- Automatic classification
- Real-time pin generation on map

### 7. **PDF Reports**
- Generate reports for any location
- Export knowledge graphs
- Downloadable analysis summaries

---

## 🐛 Troubleshooting

### **Voice control not working?**
- Ensure microphone permissions are granted in your browser
- Use Chrome/Edge (best Web Speech API support)
- Check browser console for errors

### **Map not loading?**
- Verify `NEXT_PUBLIC_MAPBOX_API_KEY` is set correctly
- Check Mapbox token permissions (needs public access)

### **Build errors?**
- Use `npm install --legacy-peer-deps` (React 19 compatibility)
- Clear `.next` folder: `rm -rf .next && npm run dev`

### **API errors?**
- Verify all API keys are set in `.env.local`
- Check API key validity and billing status
- Restart dev server after adding keys

---

## 📚 Documentation

- **Voice Commands**: See `VOICE-COMMANDS.md`
- **Project Brief**: See `CLAUDE.md`
- **CRS Specifications**: See `CRS.md`

---

## 🤝 Contributing

This is a hackathon project. For major changes, please open an issue first.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 👥 Team

Built with 💚 by the Deep Environment team

- **Ayaan** - Voice control & integration
- **Steve** - Core developer
- **Shry** - 3D force graphs and pdf generation

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini
- **ElevenLabs** for voice synthesis
- **Mapbox** for mapping technology
- **Odyssey.ml** for narrative visualizations
- **Vercel** for Next.js framework

---

## 📞 Support

For questions or issues:
- Open a GitHub issue
- Check documentation files in repo
- Review API provider docs for key-related issues

---

**🌍 Together, we monitor the planet.**
