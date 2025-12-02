import { useState, useCallback, useEffect } from 'react';
import { StickyNote, Connection, WorkspaceSettings, Position, StickyColor, BackgroundType } from '@/types/workspace';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Default settings
const defaultSettings: WorkspaceSettings = {
  background: 'dots',
  isDarkMode: true,
  soundEnabled: true,
};

// Sound effects (base64 encoded short sounds)
const playSound = (type: 'place' | 'pickup' | 'connect') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  switch (type) {
    case 'pickup':
      oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      break;
    case 'place':
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      break;
    case 'connect':
      oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      break;
  }
};

export function useWorkspace() {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [settings, setSettings] = useState<WorkspaceSettings>(defaultSettings);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('workspace-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const savedNotes = localStorage.getItem('workspace-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
    
    const savedConnections = localStorage.getItem('workspace-connections');
    if (savedConnections) {
      setConnections(JSON.parse(savedConnections));
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('workspace-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('workspace-notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('workspace-connections', JSON.stringify(connections));
  }, [connections]);

  // Apply dark mode
  useEffect(() => {
    if (settings.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.isDarkMode]);

  // Add a new note
  const addNote = useCallback((position: Position, color: StickyColor = 'yellow') => {
    const newNote: StickyNote = {
      id: generateId(),
      content: '',
      position,
      color,
      width: 200,
      height: 200,
      zIndex: maxZIndex + 1,
    };
    setMaxZIndex(prev => prev + 1);
    setNotes(prev => [...prev, newNote]);
    if (settings.soundEnabled) playSound('place');
    return newNote.id;
  }, [maxZIndex, settings.soundEnabled]);

  // Update note position
  const updateNotePosition = useCallback((id: string, position: Position) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, position } : note
    ));
  }, []);

  // Update note content
  const updateNoteContent = useCallback((id: string, content: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, content } : note
    ));
  }, []);

  // Update note color
  const updateNoteColor = useCallback((id: string, color: StickyColor) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, color } : note
    ));
  }, []);

  // Bring note to front
  const bringToFront = useCallback((id: string) => {
    setMaxZIndex(prev => prev + 1);
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, zIndex: maxZIndex + 1 } : note
    ));
    if (settings.soundEnabled) playSound('pickup');
  }, [maxZIndex, settings.soundEnabled]);

  // Delete note
  const deleteNote = useCallback((id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    setConnections(prev => prev.filter(conn => 
      conn.fromNoteId !== id && conn.toNoteId !== id
    ));
  }, []);

  // Start connecting
  const startConnection = useCallback((noteId: string) => {
    setConnectingFrom(noteId);
  }, []);

  // Complete connection
  const completeConnection = useCallback((toNoteId: string) => {
    if (connectingFrom && connectingFrom !== toNoteId) {
      // Check if connection already exists
      const exists = connections.some(
        conn => (conn.fromNoteId === connectingFrom && conn.toNoteId === toNoteId) ||
                (conn.fromNoteId === toNoteId && conn.toNoteId === connectingFrom)
      );
      
      if (!exists) {
        const newConnection: Connection = {
          id: generateId(),
          fromNoteId: connectingFrom,
          toNoteId,
        };
        setConnections(prev => [...prev, newConnection]);
        if (settings.soundEnabled) playSound('connect');
      }
    }
    setConnectingFrom(null);
  }, [connectingFrom, connections, settings.soundEnabled]);

  // Cancel connection
  const cancelConnection = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  // Delete connection
  const deleteConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<WorkspaceSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Update viewport
  const updateViewport = useCallback((newViewport: Partial<typeof viewport>) => {
    setViewport(prev => ({ ...prev, ...newViewport }));
  }, []);

  // Play sound (for external use)
  const playSoundEffect = useCallback((type: 'place' | 'pickup' | 'connect') => {
    if (settings.soundEnabled) playSound(type);
  }, [settings.soundEnabled]);

  return {
    notes,
    connections,
    settings,
    viewport,
    connectingFrom,
    addNote,
    updateNotePosition,
    updateNoteContent,
    updateNoteColor,
    bringToFront,
    deleteNote,
    startConnection,
    completeConnection,
    cancelConnection,
    deleteConnection,
    updateSettings,
    updateViewport,
    playSoundEffect,
  };
}
