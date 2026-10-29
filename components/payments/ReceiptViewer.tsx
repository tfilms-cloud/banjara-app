import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ReceiptViewer({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const x = useSharedValue(0), y = useSharedValue(0);
  const startX = useSharedValue(0), startY = useSharedValue(0);
  useEffect(() => { scale.value = 1; savedScale.value = 1; x.value = 0; y.value = 0; }, [uri]);
  const pinch = Gesture.Pinch().onUpdate(event => { scale.value = Math.min(5, Math.max(1, savedScale.value * event.scale)); }).onEnd(() => { savedScale.value = scale.value; });
  const pan = Gesture.Pan().onStart(() => { startX.value = x.value; startY.value = y.value; }).onUpdate(event => { x.value = startX.value + event.translationX; y.value = startY.value + event.translationY; });
  const animated = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }, { scale: scale.value }] }));
  return <Modal visible={Boolean(uri)} transparent={false} animationType="fade" onRequestClose={onClose}>
    <GestureHandlerRootView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close receipt" style={styles.close}>
        <Text style={styles.label}>Close receipt</Text>
      </Pressable>
      <View style={{ flex: 1, overflow: 'hidden' }}>
        <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
          <Animated.View style={[{ flex: 1 }, animated]}>{uri ? <Image source={{ uri }} style={{ flex: 1, width: '100%' }} contentFit="contain" accessibilityLabel="Payment receipt" /> : null}</Animated.View>
        </GestureDetector>
      </View>
      <Text style={styles.hint}>Pinch to zoom · drag to inspect</Text>
    </GestureHandlerRootView>
  </Modal>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  close: { padding: 20, alignSelf: 'flex-end', minHeight: 48 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  hint: { color: '#FFFFFF', textAlign: 'center', padding: 16, fontSize: 12 },
});
