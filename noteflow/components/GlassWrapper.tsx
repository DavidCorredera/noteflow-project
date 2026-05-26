import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';

export function GlassWrapper({ children, intensity = 40, ...props }: any) {
  if (Platform.OS === 'ios') {
    return (
      <BlurView intensity={intensity} tint="light" {...props}>
        {children}
      </BlurView>
    );
  }
  return children;
}
