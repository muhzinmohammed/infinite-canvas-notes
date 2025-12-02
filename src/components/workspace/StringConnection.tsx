import { useEffect, useState, useRef } from 'react';
import { Connection, StickyNote, Position } from '@/types/workspace';

interface StringConnectionProps {
  connection: Connection;
  notes: StickyNote[];
  onDelete: (id: string) => void;
}

interface PhysicsPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
}

// Number of points in the string (more = smoother but heavier)
const NUM_POINTS = 12;
const GRAVITY = 0.5;
const DAMPING = 0.98;
const STIFFNESS = 0.8;

export function StringConnection({ connection, notes, onDelete }: StringConnectionProps) {
  const [points, setPoints] = useState<PhysicsPoint[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number>();
  const fromNote = notes.find(n => n.id === connection.fromNoteId);
  const toNote = notes.find(n => n.id === connection.toNoteId);

  // Get center position of a note
  const getNoteCenter = (note: StickyNote): Position => ({
    x: note.position.x + note.width / 2,
    y: note.position.y + note.height / 2,
  });

  // Initialize points
  useEffect(() => {
    if (!fromNote || !toNote) return;

    const start = getNoteCenter(fromNote);
    const end = getNoteCenter(toNote);
    
    const newPoints: PhysicsPoint[] = [];
    for (let i = 0; i < NUM_POINTS; i++) {
      const t = i / (NUM_POINTS - 1);
      newPoints.push({
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        vx: 0,
        vy: 0,
        pinned: i === 0 || i === NUM_POINTS - 1,
      });
    }
    setPoints(newPoints);
  }, [fromNote?.id, toNote?.id]);

  // Physics simulation
  useEffect(() => {
    if (!fromNote || !toNote || points.length === 0) return;

    const simulate = () => {
      setPoints(prevPoints => {
        const newPoints = [...prevPoints];
        const start = getNoteCenter(fromNote);
        const end = getNoteCenter(toNote);

        // Update pinned points
        newPoints[0].x = start.x;
        newPoints[0].y = start.y;
        newPoints[NUM_POINTS - 1].x = end.x;
        newPoints[NUM_POINTS - 1].y = end.y;

        // Apply physics to non-pinned points
        for (let i = 1; i < NUM_POINTS - 1; i++) {
          const point = newPoints[i];
          
          // Apply gravity
          point.vy += GRAVITY;
          
          // Apply damping
          point.vx *= DAMPING;
          point.vy *= DAMPING;
          
          // Update position
          point.x += point.vx;
          point.y += point.vy;
        }

        // Apply constraints (keep string length consistent)
        for (let iteration = 0; iteration < 3; iteration++) {
          for (let i = 0; i < NUM_POINTS - 1; i++) {
            const p1 = newPoints[i];
            const p2 = newPoints[i + 1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Target distance between points
            const totalDist = Math.sqrt(
              Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
            );
            const targetDist = (totalDist / (NUM_POINTS - 1)) * 1.2; // Slightly longer for sag
            
            if (dist > 0) {
              const diff = (dist - targetDist) / dist;
              const offsetX = dx * diff * STIFFNESS;
              const offsetY = dy * diff * STIFFNESS;
              
              if (!p1.pinned) {
                p1.x += offsetX * 0.5;
                p1.y += offsetY * 0.5;
              }
              if (!p2.pinned) {
                p2.x -= offsetX * 0.5;
                p2.y -= offsetY * 0.5;
              }
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
  }, [fromNote, toNote, points.length]);

  if (!fromNote || !toNote || points.length === 0) return null;

  // Create SVG path from points
  const pathD = points.reduce((acc, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    return `${acc} L ${point.x} ${point.y}`;
  }, '');

  // Create smooth curve using quadratic bezier
  const smoothPathD = points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    if (i === 1) return `${acc} Q ${point.x} ${point.y}`;
    
    const prev = arr[i - 1];
    const midX = (prev.x + point.x) / 2;
    const midY = (prev.y + point.y) / 2;
    
    if (i === arr.length - 1) {
      return `${acc} ${midX} ${midY} T ${point.x} ${point.y}`;
    }
    
    return `${acc} ${midX} ${midY} T`;
  }, '');

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onDelete(connection.id)}
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
        opacity={isHovered ? 0.8 : 0.4}
        style={{ transition: 'all 0.2s ease' }}
      />
      
      {/* End points */}
      {isHovered && (
        <>
          <circle
            cx={points[0].x}
            cy={points[0].y}
            r={6}
            fill="hsl(var(--destructive))"
          />
          <circle
            cx={points[NUM_POINTS - 1].x}
            cy={points[NUM_POINTS - 1].y}
            r={6}
            fill="hsl(var(--destructive))"
          />
        </>
      )}
    </g>
  );
}
