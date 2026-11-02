import type { Monitorado } from '../types/monitorado.js';

export const EARTH_RADIUS_METERS = 6_371_000;

export function haversineDistanceMeters(
  first: Pick<Monitorado, 'latitude' | 'longitude'>,
  second: Pick<Monitorado, 'latitude' | 'longitude'>,
): number {
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(haversine));
}

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

