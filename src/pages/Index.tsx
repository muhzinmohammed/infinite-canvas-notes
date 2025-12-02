import { useState } from 'react';
import { Canvas } from '@/components/workspace/Canvas';
import { Navbar } from '@/components/workspace/Navbar';
import { SettingsPanel } from '@/components/workspace/SettingsPanel';
import { useWorkspace } from '@/hooks/useWorkspace';
import { StickyColor } from '@/types/workspace';

const Index = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
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
  } = useWorkspace();

  // Add note at center of viewport
  const handleAddNote = () => {
    const centerX = (window.innerWidth / 2 - viewport.x) / viewport.zoom - 100;
    const centerY = (window.innerHeight / 2 - viewport.y) / viewport.zoom - 100;
    
    // Cycle through colors
    const colors: StickyColor[] = ['yellow', 'pink', 'mint', 'blue', 'orange', 'purple'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    addNote({ x: centerX, y: centerY }, randomColor);
  };

  // Clear all notes
  const handleClearAll = () => {
    if (notes.length === 0) return;
    if (confirm('Are you sure you want to delete all notes?')) {
      notes.forEach(note => deleteNote(note.id));
    }
  };

  // Reset viewport
  const handleResetView = () => {
    updateViewport({ x: 0, y: 0, zoom: 1 });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Main Canvas */}
      <Canvas
        notes={notes}
        connections={connections}
        background={settings.background}
        viewport={viewport}
        connectingFrom={connectingFrom}
        onAddNote={addNote}
        onUpdateNotePosition={updateNotePosition}
        onUpdateNoteContent={updateNoteContent}
        onUpdateNoteColor={updateNoteColor}
        onBringToFront={bringToFront}
        onDeleteNote={deleteNote}
        onStartConnection={startConnection}
        onCompleteConnection={completeConnection}
        onCancelConnection={cancelConnection}
        onDeleteConnection={deleteConnection}
        onUpdateViewport={updateViewport}
      />

      {/* Navigation Bar */}
      <Navbar
        onAddNote={handleAddNote}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearAll={handleClearAll}
        onResetView={handleResetView}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={updateSettings}
      />
    </div>
  );
};

export default Index;
