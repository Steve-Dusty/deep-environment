'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface SpeechRecognitionResult {
  [key: number]: { transcript: string };
  length: number;
  isFinal: boolean;
}

interface SpeechRecognitionEvent {
  results: { [key: number]: SpeechRecognitionResult; length: number };
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

const WAKE_WORD = 'hey deep';

export interface VoiceCommand {
  raw: string;
  action: string;
  target?: string;
}

interface UseVoiceControlOptions {
  onCommand: (cmd: VoiceCommand) => void;
  enabled?: boolean;
}

export function useVoiceControl({ onCommand, enabled = true }: UseVoiceControlOptions) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [fullTranscript, setFullTranscript] = useState(''); // Full ongoing transcript
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const wakeDetectedRef = useRef(false);
  const commandBufferRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const parseCommand = useCallback((raw: string): VoiceCommand | null => {
    const text = raw.toLowerCase().trim();

    // Toggle commands - more natural patterns
    const toggleMatch = text.match(/^(enable|disable|toggle|turn on|turn off|show|hide|activate|deactivate)\s+(.+)$/);
    if (toggleMatch) {
      const action = ['enable', 'turn on', 'show', 'activate'].includes(toggleMatch[1]) ? 'enable' : 'disable';
      const targetMap: Record<string, string> = {
        globe: 'globe', 
        terrain: 'terrain', 
        satellite: 'satellite', 
        sat: 'satellite',
        threat: 'heatmap', 
        threats: 'heatmap',
        heatmap: 'heatmap', 
        'heat map': 'heatmap',
        weather: 'weather', 
        precipitation: 'weather', 
        precip: 'weather',
        rain: 'weather',
      };
      const target = targetMap[toggleMatch[2]] || toggleMatch[2];
      return { raw, action, target };
    }

    // View commands
    if (text.match(/show|open|display|view|switch to/)) {
      if (text.includes('graph') || text.includes('knowledge')) return { raw, action: 'show-graph' };
      if (text.includes('map') || text.includes('globe')) return { raw, action: 'show-map' };
      if (text.includes('odyssey') || text.includes('world model')) return { raw, action: 'show-odyssey' };
    }

    // Zoom commands
    if (text.match(/zoom in|closer|zoom/)) return { raw, action: 'zoom-in' };
    if (text.match(/zoom out|further|back/)) return { raw, action: 'zoom-out' };
    if (text.match(/reset view|reset zoom/)) return { raw, action: 'reset-view' };

    // Location selection - multiple patterns
    const locationPatterns = [
      /(?:go to|select|show me|focus on|navigate to|find)\s+(.+)/,
      /(?:where is|what about|tell me about|info on)\s+(.+)/,
    ];
    for (const pattern of locationPatterns) {
      const match = text.match(pattern);
      if (match) return { raw, action: 'select-location', target: match[1] };
    }

    // Clear selection
    if (text.match(/clear|deselect|close|back/)) return { raw, action: 'clear-selection' };

    // Status queries
    if (text.includes('status') || text.includes('report') || text.includes('summary')) {
      return { raw, action: 'status' };
    }

    // List commands
    if (text.match(/list|show all|what are/)) {
      if (text.includes('critical') || text.includes('urgent')) return { raw, action: 'list-critical' };
      if (text.includes('location') || text.includes('place') || text.includes('site')) return { raw, action: 'list-locations' };
      return { raw, action: 'list-all' };
    }

    // Help
    if (text.includes('help') || text.includes('commands') || text.includes('what can')) {
      return { raw, action: 'help' };
    }

    return { raw, action: 'unknown' };
  }, []);

  const processCommand = useCallback((text: string) => {
    if (isProcessingRef.current) {
      console.log('⏭️ Already processing, skipping...');
      return;
    }
    
    isProcessingRef.current = true;
    const cmd = parseCommand(text);
    if (cmd) {
      setState('processing');
      setTranscript(text);
      console.log('📤 Sending command:', cmd);
      onCommand(cmd);
    }
    // Reset for next wake word after a delay
    setTimeout(() => {
      wakeDetectedRef.current = false;
      commandBufferRef.current = '';
      isProcessingRef.current = false;
      console.log('🔄 Ready for next wake word');
    }, 3000); // Wait 3 seconds before listening for next wake word
  }, [parseCommand, onCommand]);

  useEffect(() => {
    if (!enabled) {
      recognitionRef.current?.abort();
      setState('idle');
      return;
    }

    // REQUEST MICROPHONE PERMISSION FIRST
    console.log('🎤 Requesting microphone permission...');
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('✅ Microphone permission granted!');
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error('❌ Speech Recognition not supported in this browser');
          setSupported(false);
          return;
        }

        console.log('✅ Speech Recognition supported, starting...');
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onstart = () => {
          console.log('🎤 Speech recognition started - SPEAK NOW!');
          setFullTranscript('👂 Listening... say something!');
        };

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          const last = e.results[e.results.length - 1];
          const text = last[0].transcript.toLowerCase().trim();
          
          console.log('🗣️ Heard:', text);
          
          // ALWAYS show what's being heard
          setFullTranscript(text);

          if (!wakeDetectedRef.current) {
            // Listen for wake word
            if (text.includes(WAKE_WORD)) {
              console.log('🔥 Wake word detected!');
              wakeDetectedRef.current = true;
              setState('listening');
              setTranscript(`🎤 Wake word detected!`);
              commandBufferRef.current = '';
              // Extract anything after wake word
              const afterWake = text.split(WAKE_WORD).pop()?.trim();
              if (afterWake && afterWake.length > 2) {
                commandBufferRef.current = afterWake;
                setTranscript(afterWake);
              }
            }
          } else {
            // Accumulate command
            commandBufferRef.current = text;
            setTranscript(text);

            // Clear previous timeout
            if (timeoutRef.current) clearTimeout(timeoutRef.current);

            // If this is a final result, process after short silence
            if (last.isFinal) {
              timeoutRef.current = setTimeout(() => {
                if (commandBufferRef.current) {
                  processCommand(commandBufferRef.current);
                }
              }, 800); // Wait 0.8s of silence before processing
            }
          }
        };

        recognition.onerror = (e: { error: string }) => {
          console.error('❌ Speech recognition error:', e.error);
          if (e.error === 'not-allowed') {
            setFullTranscript('❌ MICROPHONE PERMISSION DENIED - Allow mic in browser settings!');
          } else if (e.error === 'no-speech') {
            console.log('⚠️ No speech detected - keep talking');
          } else if (e.error !== 'aborted') {
            console.warn('Speech recognition error:', e.error);
          }
        };

        recognition.onend = () => {
          console.log('🔄 Speech recognition ended');
          // Restart after a short delay if still enabled
          if (enabled && !isProcessingRef.current) {
            restartTimeoutRef.current = setTimeout(() => {
              try {
                recognitionRef.current?.start();
                console.log('♻️ Restarted speech recognition');
              } catch (err) {
                console.error('Failed to restart:', err);
              }
            }, 500); // Wait 500ms before restarting
          }
        };

        try {
          recognition.start();
          console.log('🚀 Starting speech recognition...');
        } catch (err) {
          console.error('❌ Failed to start speech recognition:', err);
          setSupported(false);
        }
      })
      .catch(err => {
        console.error('❌ Microphone permission denied:', err);
        setFullTranscript('❌ MICROPHONE ACCESS DENIED! Check browser settings.');
        setSupported(false);
      });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      recognitionRef.current?.abort();
      recognitionRef.current = null;
      isProcessingRef.current = false;
    };
  }, [enabled, processCommand]);

  const setVoiceState = useCallback((s: VoiceState) => setState(s), []);

  return { 
    state, 
    transcript, 
    fullTranscript, // Add this for debugging
    supported, 
    setState: setVoiceState 
  };
}
