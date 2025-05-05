import { useCallback, useEffect, useState } from 'react';

// Custom hook for playing audio with caching
const useAudio = (url: string) => {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize audio on mount
  useEffect(() => {
    const audioElement = new Audio(url);
    // Preload the audio
    audioElement.load();
    setAudio(audioElement);

    // Cleanup on unmount
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, [url]);

  // Function to play the sound
  const play = useCallback(() => {
    if (audio) {
      // Reset the audio to the beginning if it's already playing
      audio.currentTime = 0;
      
      // Start playing
      const playPromise = audio.play();
      
      // Handle play() promise rejection (browsers require user interaction first)
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Audio play failed:', error);
          // We can't play audio without user interaction in some browsers
        });
      }
    }
  }, [audio]);

  return play;
};

export default useAudio;
