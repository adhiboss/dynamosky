import { describe, expect, it } from 'vitest';
import { flightArcPath, flightColor, indiaOutlinePath, projectIndia } from './indiaMap';

describe('India network map', () => {
  it('places Delhi north of Mumbai and Chennai east of Mumbai', () => {
    const bom = projectIndia(19.09, 72.87);
    const del = projectIndia(28.56, 77.1);
    const maa = projectIndia(12.99, 80.17);
    expect(del.y).toBeLessThan(bom.y);
    expect(maa.x).toBeGreaterThan(bom.x);
  });

  it('draws a closed outline and a curved flight arc', () => {
    expect(indiaOutlinePath().endsWith('Z')).toBe(true);
    expect(flightArcPath({ x: 10, y: 40 }, { x: 80, y: 20 })).toMatch(/^M .+ Q .+ /);
  });

  it('colors delayed and cancelled flights differently from on-time flights', () => {
    expect(flightColor('ON_TIME')).not.toBe(flightColor('DELAYED'));
    expect(flightColor('CANCELLED')).not.toBe(flightColor('ON_TIME'));
  });
});
