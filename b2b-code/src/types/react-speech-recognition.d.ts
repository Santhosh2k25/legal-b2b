declare module 'react-speech-recognition' {
  interface SpeechRecognitionHook {
    transcript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
  }

  export function useSpeechRecognition(): SpeechRecognitionHook;
  interface SpeechRecognition {
    startListening(options?: { continuous?: boolean }): void;
    stopListening(): void;
  }
  export default SpeechRecognition;
} 