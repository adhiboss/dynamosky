// Converts India GPS coordinates (lat, lng) to 3D hologram world coordinates
export interface HologramCoords {
  x: number;
  y: number;
  z: number;
}

export function projectLatLng(
  lat: number,
  lng: number,
  centerLat = 20.5,
  centerLng = 79.0,
  scaleX = 1.35,
  scaleZ = 1.6,
  baseY = 0.5
): HologramCoords {
  const x = (lng - centerLng) * scaleX;
  const z = -(lat - centerLat) * scaleZ;
  return { x, y: baseY, z };
}
