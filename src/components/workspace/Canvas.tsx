import { useRef, useState, useEffect, useCallback } from 'react';
import { StickyNote } from './StickyNote';
import { StringConnection } from './StringConnection';
import { StickyNote as StickyNoteType, Connection, Position, StickyColor, BackgroundType } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface CanvasProps {
  notes: StickyNoteType[];
  connections: Connection[];
  background: BackgroundType;
  viewport: { x: number; y: number; zoom: number };
  connectingFrom: string | null;
  onAddNote: (position: Position, color?: StickyColor) => void;
  onUpdateNotePosition: (id: string, position: Position) => void;
  onUpdateNoteContent: (id: string, content: string) => void;
  onUpdateNoteColor: (id: string, color: StickyColor) => void;
  onBringToFront: (id: string) => void;
  onDeleteNote: (id: string) => void;
  onStartConnection: (id: string) => void;
  onCompleteConnection: (id: string) => void;
  onCancelConnection: () => void;
  onDeleteConnection: (id: string) => void;
  onUpdateViewport: (viewport: Partial<{ x: number; y: number; zoom: number }>) => void;
}

export function Canvas({
  notes,
  connections,
  background,
  viewport,
  connectingFrom,
  onAddNote,
  onUpdateNotePosition,
  onUpdateNoteContent,
  onUpdateNoteColor,
  onBringToFront,
  onDeleteNote,
  onStartConnection,
  onCompleteConnection,
  onCancelConnection,
  onDeleteConnection,
  onUpdateViewport,
}: CanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Handle double click to add note
  const handleDoubleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.sticky-note')) return;
    
    const x = (e.clientX - viewport.x) / viewport.zoom;
    const y = (e.clientY - viewport.y) / viewport.zoom;
    onAddNote({ x: x - 100, y: y - 100 }); // Center the note on click
  };

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    } else if (connectingFrom && !(e.target as HTMLElement).closest('.sticky-note')) {
      onCancelConnection();
    }
  };

  // Handle mouse move for panning
  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      onUpdateViewport({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart, onUpdateViewport]);

  // Handle wheel for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewport.zoom * delta, 0.25), 2);
    
    // Zoom towards cursor position
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      
      const newX = cursorX - (cursorX - viewport.x) * (newZoom / viewport.zoom);
      const newY = cursorY - (cursorY - viewport.y) * (newZoom / viewport.zoom);
      
      onUpdateViewport({ x: newX, y: newY, zoom: newZoom });
    }
  }, [viewport, onUpdateViewport]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Background class based on setting
  const backgroundClass = {
    grid: 'canvas-grid',
    dots: 'canvas-dots',
    plain: 'canvas-plain',
  }[background];

  return (
    <div
      ref={canvasRef}
      className={cn(
        'fixed inset-0 overflow-hidden',
        backgroundClass,
        isPanning ? 'cursor-grabbing' : 'cursor-default',
        connectingFrom && 'cursor-crosshair'
      )}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
    >
      {/* Viewport container */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px)`,
          transformOrigin: '0 0',
        }}
      >
        {/* SVG layer for connections */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{
            width: '100vw',
            height: '100vh',
            overflow: 'visible',
          }}
        >
          <g className="pointer-events-auto">
            {connections.map(connection => (
              <StringConnection
                key={connection.id}
                connection={connection}
                notes={notes}
                onDelete={onDeleteConnection}
              />
            ))}
          </g>
        </svg>

        {/* Notes layer */}
        {notes.map(note => (
          <StickyNote
            key={note.id}
            note={note}
            isConnecting={!!connectingFrom}
            isConnectingFrom={connectingFrom === note.id}
            onPositionChange={onUpdateNotePosition}
            onContentChange={onUpdateNoteContent}
            onColorChange={onUpdateNoteColor}
            onBringToFront={onBringToFront}
            onDelete={onDeleteNote}
            onStartConnection={onStartConnection}
            onCompleteConnection={onCompleteConnection}
            viewport={viewport}
          />
        ))}
      </div>

      {/* Zoom indicator */}
      <div className="fixed bottom-4 left-4 glass rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
        {Math.round(viewport.zoom * 100)}%
      </div>

      {/* Help text when connecting */}
      {connectingFrom && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 glass rounded-lg px-4 py-2 text-sm">
          Click on another note to connect, or click elsewhere to cancel
        </div>
      )}
    </div>
  );
}
