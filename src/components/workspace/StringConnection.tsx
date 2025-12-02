import { useEffect, useState, useRef, useCallback } from 'react';
import { Connection, StickyNote, Position } from '@/types/workspace';

interface StringConnectionProps {
  connection: Connection;
  notes: StickyNote[];
  onDelete: (id: string) => void;
}

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
}

// Number of segments in the string
const NUM_SEGMENTS = 10;
const GRAVITY = 0.8;
const ITERATIONS = 5;

export function StringConnection({ connection, notes, onDelete }: StringConnectionProps) {
  const [points, setPoints] = useState<Point[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  
  const fromNote = notes.find(n => n.id === connection.fromNoteId);
  const toNote = notes.find(n => n.id === connection.toNoteId);

  // Get center position of a note
  const getNoteCenter = useCallback((note: StickyNote): Position => ({
    x: note.position.x + note.width / 2,
    y: note.position.y + note.height / 2,
  }), []);

  // Initialize or update endpoint positions
  useEffect(() => {
    if (!fromNote || !toNote) return;

    const start = getNoteCenter(fromNote);
    const end = getNoteCenter(toNote);

    if (points.length === 0) {
      // Initialize points
      const newPoints: Point[] = [];
      for (let i = 0; i <= NUM_SEGMENTS; i++) {
        const t = i / NUM_SEGMENTS;
        const x = start.x + (end.x - start.x) * t;
        const y = start.y + (end.y - start.y) * t;
        newPoints.push({
          x,
          y,
          oldX: x,
          oldY: y,
          pinned: i === 0 || i === NUM_SEGMENTS,
        });
      }
      setPoints(newPoints);
    }
  }, [fromNote, toNote, getNoteCenter, points.length]);

  // Physics simulation using Verlet integration
  useEffect(() => {
    if (!fromNote || !toNote || points.length === 0) return;

    const segmentLength = Math.sqrt(
      Math.pow(getNoteCenter(toNote).x - getNoteCenter(fromNote).x, 2) +
      Math.pow(getNoteCenter(toNote).y - getNoteCenter(fromNote).y, 2)
    ) / NUM_SEGMENTS * 1.1; // Slightly longer for natural sag

    const simulate = (timestamp: number) => {
      // Limit updates to ~60fps
      if (timestamp - lastUpdateRef.current < 16) {
        animationRef.current = requestAnimationFrame(simulate);
        return;
      }
      lastUpdateRef.current = timestamp;

      setPoints(prevPoints => {
        const newPoints = prevPoints.map(p => ({ ...p }));
        const start = getNoteCenter(fromNote);
        const end = getNoteCenter(toNote);

        // Update pinned endpoints
        newPoints[0].x = start.x;
        newPoints[0].y = start.y;
        newPoints[NUM_SEGMENTS].x = end.x;
        newPoints[NUM_SEGMENTS].y = end.y;

        // Apply Verlet integration with gravity
        for (let i = 1; i < NUM_SEGMENTS; i++) {
          const p = newPoints[i];
          const vx = (p.x - p.oldX) * 0.98; // Damping
          const vy = (p.y - p.oldY) * 0.98;
          
          p.oldX = p.x;
          p.oldY = p.y;
          p.x += vx;
          p.y += vy + GRAVITY;
        }

        // Apply distance constraints
        for (let iter = 0; iter < ITERATIONS; iter++) {
          for (let i = 0; i < NUM_SEGMENTS; i++) {
            const p1 = newPoints[i];
            const p2 = newPoints[i + 1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist === 0) continue;
            
            const diff = (segmentLength - dist) / dist;
            const offsetX = dx * diff * 0.5;
            const offsetY = dy * diff * 0.5;
            
            if (!p1.pinned) {
              p1.x -= offsetX;
              p1.y -= offsetY;
            }
            if (!p2.pinned) {
              p2.x += offsetX;
              p2.y += offsetY;
            }
          }
        }

        return newPoints;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [fromNote, toNote, points.length, getNoteCenter]);

  if (!fromNote || !toNote || points.length === 0) return null;

  // Create path from points
  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onDelete(connection.id);
      }}
      style={{ cursor: 'pointer' }}
    >
      {/* Invisible wider path for easier clicking */}
      <path
        d={pathD}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />
      
      {/* Visible string */}
      <path
        d={pathD}
        fill="none"
        stroke={isHovered ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'}
        strokeWidth={isHovered ? 3 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isHovered ? 0.9 : 0.5}
        style={{ transition: 'stroke 0.2s, opacity 0.2s' }}
      />
      
      {/* End point indicators on hover */}
      {isHovered && (
        <>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r={5}
            fill="hsl(var(--destructive))"
          />
          <circle
            cx={points[NUM_SEGMENTS].x}
            cy={points[NUM_SEGMENTS].y}
            r={5}
            fill="hsl(var(--destructive))"
          />
        </>
      )}
    </g>
  );
}
