import { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Image, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  visible: boolean;
  uri: string;
  onClose: () => void;
}

const screen = Dimensions.get('window');

export default function ImageViewer({ visible, uri, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [zoomed, setZoomed] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          onPress={() => setZoomed(!zoomed)}
          activeOpacity={1}
          style={styles.imageWrap}
        >
          <Image
            source={{ uri }}
            style={[
              styles.image,
              zoomed ? styles.imageZoomed : styles.imageFit,
            ]}
            resizeMode={zoomed ? 'contain' : 'contain'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeBtn, { top: insets.top + 12 }]}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    width: screen.width,
    height: screen.height - 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {},
  imageFit: {
    width: screen.width - 32,
    height: screen.height - 180,
  },
  imageZoomed: {
    width: screen.width,
    height: screen.height - 100,
  },
});
