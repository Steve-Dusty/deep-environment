# Voice Commands Reference

All commands start with the wake word: **"Hey Deep"**

## 🗺️ Navigation Commands

### Views
- **"show map"** / **"view map"** - Switch to map view
- **"show graph"** / **"view graph"** - Switch to knowledge graph
- **"show odyssey"** / **"view odyssey"** - Switch to Odyssey view
- **"show feed"** / **"view feed"** - Show location feed sidebar
- **"show agents"** / **"view agents"** - Show AI agents panel

### Location Navigation
- **"go to [location]"** / **"show [location]"** - Navigate to specific location
- **"next location"** / **"next pin"** - Go to next location
- **"previous location"** / **"previous pin"** - Go to previous location

**Available Locations**:
- California wildfires
- Amazon fire / Amazon deforestation
- Beijing smog
- Deepwater Horizon
- Flint water crisis
- Ganges pollution
- Pacific garbage patch
- Aral Sea
- Chernobyl
- Sahara expansion
- Great Barrier Reef
- Borneo orangutan
- Madagascar lemur
- Arctic ice
- Antarctic ice
- Everglades
- BP Texas City

### Odyssey Commands
- **"odyssey [location]"** - Go to Odyssey view for specific location
- **"go to odyssey"** - Switch to Odyssey view

---

## 🌍 Map Overlay Commands

### Enable Overlays
- **"enable satellite"** - Turn on satellite imagery
- **"enable terrain"** - Turn on terrain data
- **"enable precipitation"** - Turn on precipitation data
- **"enable heat map"** - Turn on heat map
- **"enable all"** - Turn on all overlays

### Disable Overlays
- **"disable satellite"** - Turn off satellite imagery
- **"disable terrain"** - Turn off terrain data
- **"disable precipitation"** - Turn off precipitation data
- **"disable heat map"** - Turn off heat map
- **"disable all"** - Turn off all overlays

---

## 🔍 Filter Commands

### Category Filters
- **"filter category air"** - Show only air quality threats
- **"filter category water"** - Show only water contamination
- **"filter category land"** - Show only land degradation
- **"filter category bio"** - Show only biodiversity threats
- **"filter category climate"** - Show only climate impacts

### Severity Filters
- **"filter severity critical"** - Show only critical threats
- **"filter severity high"** - Show only high severity
- **"filter severity medium"** - Show only medium severity
- **"filter severity low"** - Show only low severity

### Clear Filters
- **"clear filters"** - Reset all filters

---

## 🔎 Zoom Commands

- **"zoom in"** - Zoom in on map
- **"zoom out"** - Zoom out on map

---

## ℹ️ Information Queries

- **"describe location"** - Get details about current location
- **"how many agents"** / **"agent count"** - Number of active AI agents
- **"list high severity"** / **"list high"** - List all high-severity threats
- **"list category [category]"** - List threats in a specific category
- **"help"** - List available commands

---

## 🤖 Natural Language (AI-Powered)

The system also understands natural language! Try:

- **"I want to see what's happening in the Amazon"**
- **"Show me the oil spill"**
- **"Turn on the satellite stuff"**
- **"What's going on in Florida"**
- **"Filter to just water problems"**
- **"Show me the coral reef situation"**
- **"Take me to the California fires"**
- **"I want to see the graph thing"**

The AI will interpret your intent and execute the appropriate command.

---

## 💡 Tips

1. **Wake Word First**: Always say "Hey Deep" before your command
2. **Wait for Purple**: Voice indicator turns purple when ready for command
3. **Speak Clearly**: Enunciate the command after wake word
4. **Natural Language Works**: Don't worry about exact phrasing
5. **Check Console**: F12 DevTools shows AI interpretation

---

## 🎤 Example Sessions

### Session 1: Exploring Locations
```
You: "Hey Deep, show me what's happening in California"
App: "Navigating to Camp Fire California"

You: "Hey Deep, next location"
App: "Navigating to Amazon Fire"

You: "Hey Deep, describe location"
App: "Amazon Fire, critical severity air quality threat..."
```

### Session 2: Using Overlays
```
You: "Hey Deep, turn on the satellite view"
App: "Enabled satellite overlay"

You: "Hey Deep, also enable terrain"
App: "Enabled terrain overlay"

You: "Hey Deep, disable all"
App: "Disabled all overlays"
```

### Session 3: Filtering Data
```
You: "Hey Deep, show me only water problems"
App: "Filtering by category: water"

You: "Hey Deep, filter severity critical"
App: "Filtering by severity: critical"

You: "Hey Deep, clear filters"
App: "Filters cleared"
```

---

## 🔑 API Keys Required

Make sure these are set in `.env.local`:
```
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_key_here
NEXT_PUBLIC_OPENAI_API_KEY=your_key_here
```

Without these keys:
- ❌ Text-to-speech responses won't work
- ❌ AI natural language interpretation won't work
- ✅ Exact command patterns will still work

---

## 🐛 Troubleshooting

**Wake word not detected?**
- Speak clearly: "Hey" (pause) "Deep"
- Check mic permissions in browser

**Commands not working?**
- Check console (F12) for errors
- Verify API keys are set
- Look for "🤖 AI interpreting" logs

**No voice response?**
- Check ElevenLabs API key
- Volume might be muted
- Look for TTS errors in console

---

**Total Commands**: 60+ patterns + unlimited natural language via AI
