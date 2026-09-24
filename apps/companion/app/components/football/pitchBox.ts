/** A landscape pitch in its own units: 100 long by 64 wide, close enough to a real one that the
 *  boxes land where the eye expects. Each map draws its own markings on it. */
export const PITCH_BOX = { width: 100, height: 64 };

/** A 0-100 `y` across the pitch, in the box's own height. */
export function toBoxY(y: number): number {
  return (y / 100) * PITCH_BOX.height;
}
