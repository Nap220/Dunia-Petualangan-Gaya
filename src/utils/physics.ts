/**
 * Pure physics calculations and rules for "Petualangan Dunia Gaya"
 * Fully decoupled and unit-tested.
 */

export interface AppleState {
  id: string;
  x: number;
  y: number;
  vy: number;
  isLanded: boolean;
  branchOrigin: number;
}

export function updateGravityApple(
  apple: AppleState,
  gravityOn: boolean,
  groundY: number,
  dtSeconds: number = 0.016
): AppleState {
  if (apple.isLanded && gravityOn) {
    return apple;
  }

  if (gravityOn) {
    // Gravitational acceleration downwards
    const g = 600; // px/s^2
    const newVy = Math.min(apple.vy + g * dtSeconds, 700);
    const newY = apple.y + newVy * dtSeconds;

    if (newY >= groundY) {
      return {
        ...apple,
        y: groundY,
        vy: 0,
        isLanded: true,
      };
    }

    return {
      ...apple,
      y: newY,
      vy: newVy,
      isLanded: false,
    };
  } else {
    // Zero-gravity float upwards slowly
    const floatSpeed = -75; // px/s
    const newY = apple.y + floatSpeed * dtSeconds;
    // Don't fly infinitely beyond the top
    const clampedY = Math.max(newY, -50);

    return {
      ...apple,
      y: clampedY,
      vy: floatSpeed,
      isLanded: false,
    };
  }
}

// ----------------------------------------------------
// 2. GAYA OTOT
// ----------------------------------------------------
export type MuscleCharacter = 'anak' | 'dewasa';
export type MuscleObject = 'peti' | 'kulkas';

export interface MuscleOutcome {
  canMove: boolean;
  pushForceN: number;
  objectWeightN: number;
  distancePx: number;
  durationMs: number;
  description: string;
}

export const MUSCLE_CONSTANTS = {
  forceAnak: 120, // N
  forceDewasa: 350, // N
  weightPeti: 80, // N
  weightKulkas: 600, // N
} as const;

export function calculateMuscleOutcome(
  char: MuscleCharacter,
  obj: MuscleObject
): MuscleOutcome {
  const pushForceN = char === 'anak' ? MUSCLE_CONSTANTS.forceAnak : MUSCLE_CONSTANTS.forceDewasa;
  const objectWeightN = obj === 'peti' ? MUSCLE_CONSTANTS.weightPeti : MUSCLE_CONSTANTS.weightKulkas;

  if (char === 'anak' && obj === 'peti') {
    return {
      canMove: true,
      pushForceN,
      objectWeightN,
      distancePx: 260,
      durationMs: 2200,
      description: 'Anak-anak dapat mendorong kotak peti karena gaya dorong yang diberikan cukup untuk mengatasi hambatan gerak benda.',
    };
  }

  if (char === 'anak' && obj === 'kulkas') {
    return {
      canMove: false,
      pushForceN,
      objectWeightN,
      distancePx: 0,
      durationMs: 1500,
      description: 'Anak-anak belum mampu mendorong kulkas karena gaya dorong yang diberikan belum cukup untuk mengatasi hambatan geraknya.',
    };
  }

  if (char === 'dewasa' && obj === 'peti') {
    return {
      canMove: true,
      pushForceN,
      objectWeightN,
      distancePx: 500,
      durationMs: 2000,
      description: 'Orang dewasa dapat mendorong kotak peti dan kotak bergerak lebih jauh karena dorongan yang diberikan sangat kuat.',
    };
  }

  // char === 'dewasa' && obj === 'kulkas'
  return {
    canMove: true,
    pushForceN,
    objectWeightN,
    distancePx: 180,
    durationMs: 2600,
    description: 'Orang dewasa mampu memberikan gaya dorong yang cukup untuk memindahkan kulkas, meskipun jarak perpindahannya tidak terlalu jauh.',
  };
}

// ----------------------------------------------------
// 3. GAYA GESEK
// ----------------------------------------------------
export type SurfaceType = 'licin' | 'biasa' | 'berbatuan';
export type PushDirection = 'kanan' | 'kiri';

export interface SurfaceProperties {
  label: string;
  sublabel: string;
  frictionCoef: number; // mu
  pushForceN: number;
  frictionForceN: number;
  maxDistanceCm: number;
  speedMultiplier: number;
}

export const SURFACES: Record<SurfaceType, SurfaceProperties> = {
  licin: {
    label: 'Jalan Licin (Es)',
    sublabel: 'Permukaan es halus, gaya gesek sangat kecil',
    frictionCoef: 0.1,
    pushForceN: 150,
    frictionForceN: 20,
    maxDistanceCm: 350,
    speedMultiplier: 1.6,
  },
  biasa: {
    label: 'Jalan Datar Biasa',
    sublabel: 'Permukaan jalan biasa, gaya gesek sedang',
    frictionCoef: 0.45,
    pushForceN: 150,
    frictionForceN: 70,
    maxDistanceCm: 220,
    speedMultiplier: 1.0,
  },
  berbatuan: {
    label: 'Jalan Berbatuan',
    sublabel: 'Permukaan kasar berbatu, gaya gesek sangat besar',
    frictionCoef: 0.85,
    pushForceN: 150,
    frictionForceN: 130,
    maxDistanceCm: 95,
    speedMultiplier: 0.5,
  },
};

export function calculateFrictionStep(
  currentPos: number,
  targetDistance: number,
  speed: number,
  dtSeconds: number = 0.016
): { newPos: number; isFinished: boolean } {
  if (currentPos >= targetDistance) {
    return { newPos: targetDistance, isFinished: true };
  }
  const nextPos = currentPos + speed * dtSeconds;
  if (nextPos >= targetDistance) {
    return { newPos: targetDistance, isFinished: true };
  }
  return { newPos: nextPos, isFinished: false };
}

// ----------------------------------------------------
// 4. GAYA MAGNET
// ----------------------------------------------------
export interface MagnetEntity {
  id: string;
  type: 'magnet_utara' | 'magnet_selatan';
  pole: 'U' | 'S';
  x: number;
  y: number;
  isDragging?: boolean;
}

export interface ObjectEntity {
  id: string;
  name: 'paku' | 'baut' | 'kayuRanting' | 'koinPerak';
  isMagnetic: boolean;
  x: number;
  y: number;
  isAttachedTo?: string | null;
  isDragging?: boolean;
}

export function isFerromagnetic(name: ObjectEntity['name']): boolean {
  return name === 'paku' || name === 'baut';
}

export function computeDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function calculateMagnetPoleForce(
  m1: MagnetEntity,
  m2: MagnetEntity,
  interactionRadius: number = 200
): { fx: number; fy: number; dist: number; isContact: boolean } {
  const dx = m2.x - m1.x;
  const dy = m2.y - m1.y;
  const dist = Math.hypot(dx, dy);

  if (dist <= 0 || dist > interactionRadius) {
    return { fx: 0, fy: 0, dist, isContact: false };
  }

  const isOpposite = m1.pole !== m2.pole;

  // Opposite poles attract
  if (isOpposite) {
    // When within contact threshold (~55px), they latch cleanly without vibration
    if (dist <= 55) {
      return { fx: 0, fy: 0, dist, isContact: true };
    }
    // Smooth magnetic pull
    const strength = Math.min(100, (1 - dist / interactionRadius) * 90 + 20);
    const nx = dx / dist;
    const ny = dy / dist;
    return { fx: nx * strength, fy: ny * strength, dist, isContact: false };
  } else {
    // Same poles repel with smooth decay and soft cushion
    const factor = -1;
    // Stronger push when very close, but smoothly clamped
    const closeness = Math.max(0, 1 - dist / interactionRadius);
    const strength = Math.min(120, closeness * closeness * 120 + 15);
    const nx = dx / dist;
    const ny = dy / dist;
    return { fx: nx * strength * factor, fy: ny * strength * factor, dist, isContact: false };
  }
}

export function calculateObjectAttraction(
  obj: ObjectEntity,
  magnets: MagnetEntity[],
  attractionRadius: number = 180
): { fx: number; fy: number; nearestMagnetId: string | null; dist: number } {
  if (!obj.isMagnetic) {
    return { fx: 0, fy: 0, nearestMagnetId: null, dist: Infinity };
  }

  let bestDist = Infinity;
  let bestMagnet: MagnetEntity | null = null;

  for (const m of magnets) {
    const d = computeDistance(obj.x, obj.y, m.x, m.y);
    if (d < bestDist && d < attractionRadius) {
      bestDist = d;
      bestMagnet = m;
    }
  }

  if (!bestMagnet) {
    return { fx: 0, fy: 0, nearestMagnetId: null, dist: Infinity };
  }

  const dx = bestMagnet.x - obj.x;
  const dy = bestMagnet.y - obj.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 4) {
    return { fx: 0, fy: 0, nearestMagnetId: bestMagnet.id, dist };
  }

  // Smooth pull acceleration
  const strength = Math.min(220, (1 - dist / attractionRadius) * 200 + 40);
  const nx = dx / dist;
  const ny = dy / dist;

  return {
    fx: nx * strength,
    fy: ny * strength,
    nearestMagnetId: bestMagnet.id,
    dist,
  };
}

// ----------------------------------------------------
// 5. GAYA PEGAS
// ----------------------------------------------------
export function calculateSpringEnergy(compressionRatio: number, k: number = 500): number {
  // E = 1/2 * k * x^2, where x is compression in 0..1 range
  const clampedX = Math.max(0, Math.min(1, compressionRatio));
  return 0.5 * k * (clampedX * clampedX);
}

export function calculateSpringJumpHeight(compressionRatio: number, maxPixelHeight: number = 440): number {
  // Jump height is proportional to stored potential energy E = 0.5 * k * x^2
  const clampedX = Math.max(0, Math.min(1, compressionRatio));
  // Non-linear realistic response: x^1.8 gives visible low jump for slight, very high for max
  const power = Math.pow(clampedX, 1.8);
  return Math.round(power * maxPixelHeight);
}
