'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { interpretVoiceCommand, AICommandResult } from '@/data/ai';

interface VoiceControlProps {
  onCommand: (result: AICommandResult) => void;
  isEnabled: boolean;
  onToggle: () => void;
}

export default function VoiceControl({ onCommand, isEnabled, onToggle }: VoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'executing'>('idle');
  const [lastCommand, setLastCommand] = useState<AICommandResult | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      setIsListening(true);
      setStatus('listening');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;

      console.log('📝 Transcript:', transcriptText);
      setTranscript(transcriptText);

      // If final result, process it
      if (event.results[current].isFinal) {
        processCommand(transcriptText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Speech recognition error:', event.error);
      setIsListening(false);
      setStatus('idle');

      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please enable microphone permissions.');
      }
    };

    recognition.onend = () => {
      console.log('🎤 Voice recognition ended');
      setIsListening(false);
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const processCommand = async (text: string) => {
    setStatus('processing');
    setTranscript(text);

    try {
      console.log('🧠 Interpreting command:', text);
      const result = await interpretVoiceCommand(text);

      console.log('✅ AI interpretation:', result);
      setLastCommand(result);
      setStatus('executing');

      // Speak the confirmation
      speak(`${result.reasoning || 'Executing command'}`);

      // Execute the command
      onCommand(result);

      // Reset after brief delay
      timeoutRef.current = setTimeout(() => {
        setStatus('idle');
        setTranscript('');
      }, 3000);

    } catch (error) {
      console.error('❌ Command processing failed:', error);
      speak('Sorry, I could not process that command');
      setStatus('idle');
    }
  };

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not available in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('idle');
    } else {
      setTranscript('');
      setLastCommand(null);
      recognitionRef.current.start();
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Main Voice Button */}
      <div className="relative">
        <button
          onClick={toggleListening}
          className={`
            relative w-16 h-16 rounded-full flex items-center justify-center
            transition-all duration-300 shadow-lg
            ${isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/50 animate-pulse'
              : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/50'
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-7 h-7 text-white" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}

          {/* Pulsing ring when listening */}
          {isListening && (
            <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
          )}
        </button>

        {/* Mute button when speaking */}
        {isSpeaking && (
          <button
            onClick={stopSpeaking}
            className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center shadow-lg transition-all"
          >
            <VolumeX className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      {/* Status Panel */}
      {(transcript || lastCommand) && (
        <div className="absolute bottom-20 right-0 w-80 bg-gray-900/95 border border-teal-500/30 rounded-lg p-4 shadow-xl backdrop-blur-sm">
          {/* Status indicator */}
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${
              status === 'listening' ? 'bg-red-500 animate-pulse' :
              status === 'processing' ? 'bg-yellow-500 animate-pulse' :
              status === 'executing' ? 'bg-green-500 animate-pulse' :
              'bg-gray-500'
            }`} />
            <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">
              {status}
            </span>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-1 font-mono">You said:</div>
              <div className="text-sm text-white font-medium">{transcript}</div>
            </div>
          )}

          {/* AI Interpretation */}
          {lastCommand && (
            <div className="border-t border-gray-700 pt-3">
              <div className="text-xs text-gray-500 mb-1 font-mono">Interpretation:</div>
              <div className="text-sm text-teal-400 mb-2">
                <span className="font-bold">{lastCommand.action}</span>
                {lastCommand.target && <span className="text-gray-400"> → {lastCommand.target}</span>}
              </div>

              {lastCommand.reasoning && (
                <div className="text-xs text-gray-400 italic">{lastCommand.reasoning}</div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-gray-500">Confidence:</div>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      lastCommand.confidence >= 80 ? 'bg-green-500' :
                      lastCommand.confidence >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${lastCommand.confidence}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 font-mono">{lastCommand.confidence}%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help hint */}
      {!isListening && !transcript && (
        <div className="absolute bottom-20 right-0 text-xs text-gray-500 text-right whitespace-nowrap font-mono">
          Click to start voice control
        </div>
      )}
    </div>
  );
}
