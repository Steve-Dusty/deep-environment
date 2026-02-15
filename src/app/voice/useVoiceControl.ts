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
  fromAI?: boolean; // Flag if command came from AI interpretation
}

interface UseVoiceControlOptions {
  onCommand: (cmd: VoiceCommand) => void;
  onAIFallback?: (speech: string) => Promise<VoiceCommand>; // AI interpretation fallback
  enabled?: boolean;
}

export function useVoiceControl({ onCommand, onAIFallback, enabled = true }: UseVoiceControlOptions) {
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
  const isStartingRef = useRef(false);

  // Minimal fallback commands that work without AI (emergencies only)
  const parseEmergencyCommand = useCallback((raw: string): VoiceCommand | null => {
    const text = raw.toLowerCase().trim();
    
    // Critical commands that must work even if OpenAI is down
    if (text === 'stop' || text === 'cancel' || text === 'abort') {
      return { raw, action: 'stop' };
    }
    if (text === 'help' || text === 'what can you do') {
      return { raw, action: 'help' };
    }
    
    // Everything else goes to AI
    return null;
  }, []);

  const processCommand = useCallback(async (text: string) => {
    if (isProcessingRef.current) {
      console.log('⏭️ Already processing, skipping...');
      return;
    }
    
    isProcessingRef.current = true;
    setState('processing');
    setTranscript(text);
    
    // First check emergency commands (work even if OpenAI is down)
    let cmd = parseEmergencyCommand(text);
    
    // If not an emergency command, use AI for everything
    if (!cmd && onAIFallback) {
      console.log('🤖 Sending to AI for interpretation...');
      try {
        const aiCmd = await onAIFallback(text);
        cmd = { ...aiCmd, fromAI: true };
        console.log('✨ AI interpreted command:', cmd);
      } catch (e) {
        console.error('❌ AI interpretation failed:', e);
        // Provide fallback error command
        cmd = { raw: text, action: 'error', target: 'AI unavailable' };
      }
    } else if (!cmd) {
      console.warn('⚠️ No AI fallback available and not an emergency command');
      cmd = { raw: text, action: 'error', target: 'No AI fallback configured' };
    }
    
    if (cmd) {
      console.log('📤 Sending command:', cmd);
      onCommand(cmd);
    }

    // Reset for next wake word immediately - keep listening!
    setTimeout(() => {
      wakeDetectedRef.current = false;
      commandBufferRef.current = '';
      isProcessingRef.current = false;
      setState('idle'); // Back to idle but still listening
      setTranscript('');
      console.log('🔄 Ready for next wake word - still listening!');
    }, 1000); // Shorter delay so it's ready faster
  }, [parseEmergencyCommand, onCommand, onAIFallback]);

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
          isStartingRef.current = false; // Successfully started
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
            isStartingRef.current = false;
          } else if (e.error === 'no-speech') {
            console.log('⚠️ No speech detected - continuing...');
            // Don't reset isStartingRef - it's still running
          } else if (e.error === 'aborted') {
            console.log('⚠️ Recognition aborted - will restart if needed');
            isStartingRef.current = false;
          } else {
            console.warn('Speech recognition error:', e.error);
            isStartingRef.current = false;
          }
        };

        recognition.onend = () => {
          console.log('🔄 Speech recognition ended');
          isStartingRef.current = false;

          // Restart after a short delay if still enabled and not already restarting
          if (enabled && !isProcessingRef.current && !isStartingRef.current) {
            restartTimeoutRef.current = setTimeout(() => {
              if (!isStartingRef.current && enabled) {
                try {
                  isStartingRef.current = true;
                  recognitionRef.current?.start();
                  console.log('♻️ Restarted speech recognition');
                } catch (err) {
                  console.error('Failed to restart:', err);
                  isStartingRef.current = false;
                }
              }
            }, 500); // Wait 500ms before restarting
          }
        };

        try {
          isStartingRef.current = true;
          recognition.start();
          console.log('🚀 Starting speech recognition...');
        } catch (err) {
          console.error('❌ Failed to start speech recognition:', err);
          setSupported(false);
          isStartingRef.current = false;
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
      isStartingRef.current = false;
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
