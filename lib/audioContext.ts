import { useState, useEffect } from 'react';
import useSound from 'use-sound';

// Default sound paths
const CORRECT_SOUND_PATH = '/sounds/correct.mp3';
const INCORRECT_SOUND_PATH = '/sounds/incorrect.mp3';
const WARNING_SOUND_PATH = '/sounds/warning.mp3';

// Default sound settings
const DEFAULT_VOLUME = 0.7;
const DEFAULT_ENABLED = true;

// LocalStorage keys
const VOLUME_STORAGE_KEY = 'waste-detection-volume';
const SOUND_ENABLED_KEY = 'waste-detection-sound-enabled';
const SOUND_CHOICE_KEY = 'waste-detection-sound-choice';

export type SoundType = 'correct' | 'incorrect' | 'warning';
export type SoundChoice = 'bell' | 'chime' | 'alert' | 'notification' | 'funny' | 'custom';

interface SoundSettings {
  enabled: boolean;
  volume: number;
  choice: SoundChoice;
}

// Helper to get settings from localStorage
const getSavedSettings = (): SoundSettings => {
  if (typeof window === 'undefined') {
    return {
      enabled: DEFAULT_ENABLED,
      volume: DEFAULT_VOLUME,
      choice: 'bell' as SoundChoice,
    };
  }

  return {
    enabled: localStorage.getItem(SOUND_ENABLED_KEY) === 'false' ? false : DEFAULT_ENABLED,
    volume: parseFloat(localStorage.getItem(VOLUME_STORAGE_KEY) || DEFAULT_VOLUME.toString()),
    choice: (localStorage.getItem(SOUND_CHOICE_KEY) || 'bell') as SoundChoice,
  };
};

// Helper to save settings to localStorage
const saveSettings = (settings: SoundSettings) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(SOUND_ENABLED_KEY, settings.enabled.toString());
  localStorage.setItem(VOLUME_STORAGE_KEY, settings.volume.toString());
  localStorage.setItem(SOUND_CHOICE_KEY, settings.choice);
};

export const useAudioContext = () => {
  const [settings, setSettings] = useState<SoundSettings>(getSavedSettings());
  
  // Get the correct sound path based on the sound choice
  const getSoundPath = (type: SoundType): string => {
    // Special case for funny sounds
    if (settings.choice === 'funny') {
      switch (type) {
        case 'correct':
          return '/sounds/funny/tada.mp3';
        case 'incorrect':
          return '/sounds/funny/cartoon_fail.mp3';
        case 'warning':
          return '/sounds/funny/wilhelm_scream.mp3';
        default:
          return '/sounds/funny/funny_alert.mp3';
      }
    }
    
    // Regular sound categories
    const basePath = `/sounds/${settings.choice}`;
    
    switch (type) {
      case 'correct':
        return `${basePath}_correct.mp3`;
      case 'incorrect':
        return `${basePath}_incorrect.mp3`;
      case 'warning':
        return `${basePath}_warning.mp3`;
      default:
        return INCORRECT_SOUND_PATH;
    }
  };
  
  // Initialize sound hooks with explicit handling for loading errors
  const [playCorrect, { sound: correctSound }] = useSound(getSoundPath('correct'), { 
    volume: settings.volume,
    soundEnabled: settings.enabled,
    interrupt: true, // Allow sounds to interrupt each other
  });
  
  const [playIncorrect, { sound: incorrectSound }] = useSound(getSoundPath('incorrect'), { 
    volume: settings.volume,
    soundEnabled: settings.enabled,
    interrupt: true,
  });
  
  const [playWarning, { sound: warningSound }] = useSound(getSoundPath('warning'), { 
    volume: settings.volume,
    soundEnabled: settings.enabled,
    interrupt: true,
  });
  
  // Check if sounds loaded correctly
  useEffect(() => {
    console.log("Audio context initialized with settings:", settings);
    console.log("Sound paths:", {
      correct: getSoundPath('correct'),
      incorrect: getSoundPath('incorrect'),
      warning: getSoundPath('warning')
    });
    
    // Create test sounds to check if audio works
    const testAudio = new Audio(getSoundPath('correct'));
    testAudio.addEventListener('canplaythrough', () => {
      console.log('Audio can play through - sound system works');
    });
    testAudio.addEventListener('error', (e) => {
      console.error('Audio error when testing sound system:', e);
    });
    
    // Check browser audio policies
    if (typeof window !== 'undefined') {
      document.addEventListener('click', () => {
        console.log('User interaction detected - should be able to play audio now');
      }, { once: true });
    }
  }, []);
  
  // Update settings and save to localStorage
  const updateSettings = (newSettings: Partial<SoundSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };
  
  // Play a sound based on type
  const playSound = (type: SoundType) => {
    if (!settings.enabled) {
      console.log(`Sound disabled. Not playing ${type} sound.`);
      return;
    }
    
    console.log(`Attempting to play ${type} sound. Volume: ${settings.volume}, Sound choice: ${settings.choice}`);
    const soundPath = getSoundPath(type);
    console.log(`Sound path: ${soundPath}`);
    
    try {
      switch (type) {
        case 'correct':
          console.log('Playing correct sound');
          playCorrect();
          break;
        case 'incorrect':
          console.log('Playing incorrect sound');
          playIncorrect();
          break;
        case 'warning':
          console.log('Playing warning sound');
          playWarning();
          break;
      }
      console.log(`Played ${type} sound successfully`);
    } catch (error) {
      console.error(`Error playing ${type} sound:`, error);
    }
  };
  
  // Load settings from localStorage on mount
  useEffect(() => {
    setSettings(getSavedSettings());
  }, []);
  
  return {
    settings,
    updateSettings,
    playSound,
  };
};

/**
 * Simplified hook for playing sounds in the application
 * @returns Object with play function and audio settings
 */
export const useAudio = () => {
  const audioContext = useAudioContext();
  
  return {
    play: audioContext.playSound,
    enabled: audioContext.settings.enabled,
    setEnabled: (enabled: boolean) => audioContext.updateSettings({ enabled }),
    volume: audioContext.settings.volume,
    setVolume: (volume: number) => audioContext.updateSettings({ volume }),
    soundChoice: audioContext.settings.choice,
    setSoundChoice: (choice: SoundChoice) => audioContext.updateSettings({ choice }),
  };
}; 