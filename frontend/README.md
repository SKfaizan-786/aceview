# AceView Frontend - Focused Elite MVP

This is the Next.js frontend for AceView, an AI Interview Coach application built for the Vision Agents SDK hackathon.

## 🎯 Judge Magnet Features

This MVP showcases 3 core features designed to impress:

1. **Confidence Ring** - Dynamic glowing border around video preview
   - Green: High confidence (score > 75)
   - Yellow: Medium confidence (score 60-75)
   - Red: Low confidence (score < 60)
   - Real-time updates based on posture, eye contact, and speech metrics

2. **Live Filler Word Highlighter** - Scrolling transcript with automatic highlighting
   - Detects: "umm", "uh", "like", "you know", "basically", "actually"
   - Highlights in red with background
   - Auto-scrolls to latest transcript

3. **Invisible AI Nudges** - Minimalist overlay with smart suggestions
   - Appears in top-right corner
   - Auto-dismisses after 5 seconds
   - Non-intrusive design for real interview use

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Icons**: Lucide React
- **Video**: @stream-io/video-react-sdk (ready for integration)

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.tsx              # Landing page
│   ├── interview/page.tsx    # Main interview session
│   ├── dashboard/page.tsx    # Analytics dashboard
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   └── Interview/
│       ├── VideoPreview.tsx       # Webcam with confidence ring
│       ├── LiveTranscript.tsx     # Transcript with filler word highlighting
│       ├── MetricsDisplay.tsx     # Real-time metrics panel
│       ├── AIPromptOverlay.tsx    # Invisible AI nudges
│       └── DevDebugPanel.tsx      # Mock trigger buttons for demo
├── store/
│   └── interviewStore.ts     # Zustand state management
└── lib/
    └── utils.ts              # Utility functions
```

## 🎨 Design System

### Colors (Dark Mode with Neon Accents)
- **Background**: Deep grays (#0f172a) and blacks (#020617)
- **Neon Accents**:
  - Green (#22c55e) - High confidence, success
  - Yellow (#eab308) - Medium confidence, warnings
  - Red (#ef4444) - Low confidence, alerts
  - Blue (#3b82f6) - Eye contact metrics
  - Purple (#a855f7) - Speech pace metrics

### Typography
- **Font**: Inter (Google Fonts)
- **Sizes**: Responsive scale from text-xs to text-6xl

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+ (currently using v22.11.0)
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🎮 Demo Mode

The app includes a **Dev Debug Panel** (bottom-right corner) with mock triggers:

- **Trigger Slouch**: Drops posture score, changes ring to red
- **Trigger Filler Word**: Adds filler words to transcript
- **Trigger AI Nudge**: Shows example AI suggestion

This allows you to demo all features without backend integration.

## 📊 Features Breakdown

### Home Page (`/`)
- Hero section with branding
- Feature cards explaining the 3 judge magnet features
- CTA buttons to start practice or view dashboard

### Interview Session (`/interview`)
- Video preview with confidence ring (Feature #1)
- Live transcript with filler word highlighting (Feature #2)
- Real-time metrics display (posture, eye contact, speech pace)
- AI prompt overlay (Feature #3)
- Dev debug panel for demo triggers

### Dashboard (`/dashboard`)
- Session history with scores
- Progress tracking
- Top strengths and improvement areas
- Stats cards (average score, improvement, total practice time)

## 🔌 Backend Integration (Future)

The frontend is ready for backend integration:

1. Replace mock data in `interviewStore.ts` with real API calls
2. Connect `VideoPreview.tsx` to Stream Video SDK
3. Integrate Deepgram STT for real transcript
4. Connect to Vision Agents backend for metrics

### API Endpoints (Expected)
```typescript
POST /api/sessions/start      // Start interview session
POST /api/sessions/end        // End session, get report
GET  /api/sessions/:id        // Get session details
GET  /api/dashboard/stats     // Get user statistics
```

## 🎯 Hackathon Submission Checklist

- [x] Futuristic AI aesthetic (dark mode + neon)
- [x] Confidence Ring (dynamic color states)
- [x] Live Filler Word Highlighter
- [x] Invisible AI Nudges
- [x] Mock/Simulation mode (Dev Debug Panel)
- [x] Responsive design
- [x] TypeScript for type safety
- [x] Clean, maintainable code structure

## 🚀 Next Steps (Post-Hackathon)

1. **Backend Integration**
   - Connect to Vision Agents SDK
   - Implement real-time WebRTC video streaming
   - Integrate Deepgram for STT
   - Connect Gemini for answer analysis

2. **Additional Pages**
   - Login/Signup
   - Reports page with PDF download
   - Settings page

3. **Enhanced Features**
   - Video recording and replay
   - Detailed analytics charts
   - Progress tracking over time
   - Personalized improvement plans

4. **Mobile Optimization**
   - Responsive design improvements
   - Touch-friendly controls
   - Mobile camera handling

## 📝 License

This project is part of the Vision Agents SDK hackathon submission.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide](https://lucide.dev/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
