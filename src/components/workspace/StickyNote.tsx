import { useState, useRef, useEffect } from 'react';
import { StickyNote as StickyNoteType, StickyColor, Position } from '@/types/workspace';
import { X, Link2, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyNoteProps {
  note: StickyNoteType;
  isConnecting: boolean;
  isConnectingFrom: boolean;
  onPositionChange: (id: string, position: Position) => void;
  onContentChange: (id: string, content: string) => void;
  onColorChange: (id: string, color: StickyColor) => void;
  onBringToFront: (id: string) => void;
  onDelete: (id: string) => void;
  onStartConnection: (id: string) => void;
  onCompleteConnection: (id: string) => void;
}

const colorClasses: Record<StickyColor, string> = {
  yellow: 'bg-sticky-yellow',
  pink: 'bg-sticky-pink',
  mint: 'bg-sticky-mint',
  blue: 'bg-sticky-blue',
  orange: 'bg-sticky-orange',
  purple: 'bg-sticky-purple',
};

const colors: StickyColor[] = ['yellow', 'pink', 'mint', 'blue', 'orange', 'purple'];

export function StickyNote({
  note,
  isConnecting,
  isConnectingFrom,
  onPositionChange,
  onContentChange,
  onColorChange,
  onBringToFront,
  onDelete,
  onStartConnection,
  onCompleteConnection,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    // Don't start drag if clicking on textarea or buttons
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    // If we're in connecting mode and this isn't the source note, complete the connection
    if (isConnecting && !isConnectingFrom) {
      e.preventDefault();
      e.stopPropagation();
      onCompleteConnection(note.id);
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setHasMoved(false);
    onBringToFront(note.id);
    
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: note.position.x, y: note.position.y };
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      
      // Check if actually moved (to distinguish from click)
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        setHasMoved(true);
      }
      
      // Get the current zoom level from the parent transform
      const canvas = document.querySelector('.canvas-content') as HTMLElement | null;
      const transform = canvas?.style?.transform || '';
      const scaleMatch = transform.match(/scale\(([^)]+)\)/);
      const zoom = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
      
      const newX = initialPos.current.x + deltaX / zoom;
      const newY = initialPos.current.y + deltaY / zoom;
      
      onPositionChange(note.id, { x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, note.id, onPositionChange]);

  // Handle starting a connection
  const handleStartConnection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onStartConnection(note.id);
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        'sticky-note paper-texture absolute select-none',
        colorClasses[note.color],
        isDragging && 'dragging',
        isConnectingFrom && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        isConnecting && !isConnectingFrom && 'ring-2 ring-primary/30 hover:ring-primary cursor-pointer',
        'animate-pop-in'
      )}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Connection target overlay - shows when connecting */}
      {isConnecting && !isConnectingFrom && (
        <div 
          className="absolute inset-0 z-30 flex items-center justify-center bg-primary/10 rounded-sm"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onCompleteConnection(note.id);
          }}
        >
          <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-medium">
            Click to connect
          </div>
        </div>
      )}

      {/* Fold effect */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-0 right-0 w-12 h-12 bg-foreground/5 transform rotate-45 translate-x-6 -translate-y-6"
        />
      </div>

      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleStartConnection}
          className={cn(
            'p-1.5 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors',
            isConnectingFrom && 'bg-primary text-primary-foreground'
          )}
          title="Connect to another note"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowColorPicker(!showColorPicker);
          }}
          className="p-1.5 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors"
          title="Change color"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(note.id);
          }}
          className="p-1.5 rounded-md bg-foreground/10 hover:bg-destructive/80 hover:text-destructive-foreground transition-colors"
          title="Delete note"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Color picker */}
      {showColorPicker && (
        <div className="absolute top-10 right-2 glass rounded-lg p-2 flex gap-1 z-20">
          {colors.map(color => (
            <button
              key={color}
              className={cn(
                'w-6 h-6 rounded-full border-2 border-foreground/20 transition-transform hover:scale-110',
                colorClasses[color],
                note.color === color && 'ring-2 ring-foreground ring-offset-1'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onColorChange(note.id, color);
                setShowColorPicker(false);
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <textarea
        value={note.content}
        onChange={(e) => onContentChange(note.id, e.target.value)}
        placeholder="Write something..."
        className={cn(
          'w-full h-full p-4 pt-8 bg-transparent resize-none outline-none',
          'text-foreground/90 placeholder:text-foreground/40',
          'font-medium text-sm leading-relaxed',
          isConnecting && !isConnectingFrom && 'pointer-events-none'
        )}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
