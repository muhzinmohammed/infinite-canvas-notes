// Type definitions for the workspace

export type StickyColor = 'yellow' | 'pink' | 'mint' | 'blue' | 'orange' | 'purple';

export type BackgroundType = 'grid' | 'dots' | 'plain';

export interface Position {
  x: number;
  y: number;
}

export interface StickyNote {
  id: string;
  content: string;
  position: Position;
  color: StickyColor;
  width: number;
  height: number;
  zIndex: number;
}

export interface Connection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
}

export interface WorkspaceSettings {
  background: BackgroundType;
  isDarkMode: boolean;
  soundEnabled: boolean;
}

export interface WorkspaceState {
  notes: StickyNote[];
  connections: Connection[];
  settings: WorkspaceSettings;
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}
