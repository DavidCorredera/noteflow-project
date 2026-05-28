import * as Location from 'expo-location';

export type LocationData = {
  latitude: number;
  longitude: number;
  name: string | null;
};

export async function getCurrentLocation(): Promise<LocationData | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const position = await Location.getCurrentPositionAsync({});
  const [address] = await Location.reverseGeocodeAsync(position.coords);

  const street = address?.street || '';
  const city = address?.city || '';
  const name = [street, city].filter(Boolean).join(', ') || null;

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    name,
  };
}
