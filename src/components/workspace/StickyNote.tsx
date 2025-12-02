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
  viewport: { x: number; y: number; zoom: number };
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
  viewport,
}: StickyNoteProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'TEXTAREA' || 
        (e.target as HTMLElement).closest('button')) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    onBringToFront(note.id);
    
    const rect = noteRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = (e.clientX - viewport.x - dragOffset.current.x) / viewport.zoom;
      const newY = (e.clientY - viewport.y - dragOffset.current.y) / viewport.zoom;
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
  }, [isDragging, note.id, onPositionChange, viewport]);

  // Handle connection click
  const handleConnectionClick = () => {
    if (isConnecting && !isConnectingFrom) {
      onCompleteConnection(note.id);
    } else if (!isConnecting) {
      onStartConnection(note.id);
    }
  };

  return (
    <div
      ref={noteRef}
      className={cn(
        'sticky-note paper-texture absolute select-none',
        colorClasses[note.color],
        isDragging && 'dragging',
        isConnectingFrom && 'ring-2 ring-primary ring-offset-2',
        isConnecting && !isConnectingFrom && 'hover:ring-2 hover:ring-primary/50',
        'animate-pop-in'
      )}
      style={{
        left: note.position.x,
        top: note.position.y,
        width: note.width,
        height: note.height,
        zIndex: note.zIndex,
        transform: `scale(${viewport.zoom})`,
        transformOrigin: 'top left',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Fold effect */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-12 h-12 bg-foreground/5 transform rotate-45 translate-x-6 -translate-y-6"
        />
      </div>

      {/* Toolbar */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleConnectionClick}
          className={cn(
            'p-1.5 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors',
            isConnectingFrom && 'bg-primary text-primary-foreground'
          )}
          title="Connect to another note"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="p-1.5 rounded-md bg-foreground/10 hover:bg-foreground/20 transition-colors"
          title="Change color"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onDelete(note.id)}
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
              onClick={() => {
                onColorChange(note.id, color);
                setShowColorPicker(false);
              }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <textarea
        ref={textareaRef}
        value={note.content}
        onChange={(e) => onContentChange(note.id, e.target.value)}
        placeholder="Write something..."
        className={cn(
          'w-full h-full p-4 pt-8 bg-transparent resize-none outline-none',
          'text-foreground/90 placeholder:text-foreground/40',
          'font-medium text-sm leading-relaxed'
        )}
        style={{ cursor: isDragging ? 'grabbing' : 'text' }}
      />
    </div>
  );
}
