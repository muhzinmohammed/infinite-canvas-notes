import { X, Moon, Sun, Volume2, VolumeX, Grid3X3, Circle, Square } from 'lucide-react';
import { WorkspaceSettings, BackgroundType } from '@/types/workspace';
import { cn } from '@/lib/utils';

interface SettingsPanelProps {
  isOpen: boolean;
  settings: WorkspaceSettings;
  onClose: () => void;
  onUpdateSettings: (settings: Partial<WorkspaceSettings>) => void;
}

const backgroundOptions: { type: BackgroundType; icon: typeof Grid3X3; label: string }[] = [
  { type: 'grid', icon: Grid3X3, label: 'Grid' },
  { type: 'dots', icon: Circle, label: 'Dots' },
  { type: 'plain', icon: Square, label: 'Plain' },
];

export function SettingsPanel({ isOpen, settings, onClose, onUpdateSettings }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-4 top-4 bottom-4 w-80 glass rounded-2xl z-50 overflow-hidden animate-pop-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h2 className="font-semibold text-lg">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Theme */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Theme</label>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateSettings({ isDarkMode: false })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
                  !settings.isDarkMode 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Sun className="w-4 h-4" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => onUpdateSettings({ isDarkMode: true })}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border transition-all',
                  settings.isDarkMode 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Moon className="w-4 h-4" />
                <span className="text-sm font-medium">Dark</span>
              </button>
            </div>
          </div>
          
          {/* Background */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Background</label>
            <div className="grid grid-cols-3 gap-2">
              {backgroundOptions.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => onUpdateSettings({ background: type })}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all',
                    settings.background === type 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Sound */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">Sound Effects</label>
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                settings.soundEnabled 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-3">
                {settings.soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-primary" />
                ) : (
                  <VolumeX className="w-5 h-5 text-muted-foreground" />
                )}
                <span className="text-sm font-medium">
                  {settings.soundEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  settings.soundEnabled ? 'bg-primary' : 'bg-muted'
                )}
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 rounded-full bg-background transition-transform',
                    settings.soundEnabled ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
            </button>
          </div>
          
          {/* Info */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              Tip: Double-click on the canvas to add a new note. 
              Click the link icon on a note to connect it to another.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
