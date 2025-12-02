import { Plus, Settings, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onAddNote: () => void;
  onOpenSettings: () => void;
  onClearAll: () => void;
  onResetView: () => void;
}

export function Navbar({ onAddNote, onOpenSettings, onClearAll, onResetView }: NavbarProps) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="glass rounded-2xl px-2 py-2 flex items-center gap-1">
        <button
          onClick={onAddNote}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'bg-primary text-primary-foreground',
            'hover:opacity-90 transition-all',
            'font-medium text-sm'
          )}
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <button
          onClick={onResetView}
          className={cn(
            'p-2.5 rounded-xl',
            'hover:bg-accent transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        
        <button
          onClick={onClearAll}
          className={cn(
            'p-2.5 rounded-xl',
            'hover:bg-destructive/10 hover:text-destructive transition-colors',
            'text-muted-foreground'
          )}
          title="Clear all notes"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        <button
          onClick={onOpenSettings}
          className={cn(
            'p-2.5 rounded-xl',
            'hover:bg-accent transition-colors',
            'text-muted-foreground hover:text-foreground'
          )}
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </nav>
  );
}
