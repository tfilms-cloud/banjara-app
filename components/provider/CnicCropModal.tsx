import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image as RNImage,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

/** Pakistani CNIC card ratio (ID-1), landscape. */
export const CNIC_ASPECT = 85.6 / 53.98;

type Props = {
  visible: boolean;
  imageUri: string | null;
  title?: string;
  onCancel: () => void;
  onCropped: (uri: string) => void;
};

type ImageSize = { width: number; height: number };

const AnimatedImage = Animated.createAnimatedComponent(Image);

export function CnicCropModal({
  visible,
  imageUri,
  title = 'Crop CNIC',
  onCancel,
  onCropped,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [natural, setNatural] = useState<ImageSize | null>(null);
  const [workingUri, setWorkingUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startTx = useSharedValue(0);
  const startTy = useSharedValue(0);

  const screen = Dimensions.get('window');
  const frame = useMemo(() => {
    const maxW = screen.width - Spacing.lg * 2;
    const maxH = screen.height * 0.52;
    let width = maxW;
    let height = width / CNIC_ASPECT;
    if (height > maxH) {
      height = maxH;
      width = height * CNIC_ASPECT;
    }
    return { width, height };
  }, [screen.height, screen.width]);

  useEffect(() => {
    if (!visible || !imageUri) return;
    let cancelled = false;
    setWorkingUri(imageUri);
    setNatural(null);
    scale.value = 1;
    tx.value = 0;
    ty.value = 0;

    // Named import only — never dynamic import('react-native') (loads PushNotificationIOS in Expo Go).
    RNImage.getSize(
      imageUri,
      (width, height) => {
        if (!cancelled && width > 0 && height > 0) {
          setNatural({ width, height });
        }
      },
      () => {
        void ImageManipulator.manipulateAsync(imageUri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
        })
          .then((info) => {
            if (!cancelled && info.width && info.height) {
              setNatural({ width: info.width, height: info.height });
            }
          })
          .catch(() => undefined);
      }
    );

    return () => {
      cancelled = true;
    };
  }, [visible, imageUri, scale, tx, ty]);

  const baseScale = useMemo(() => {
    if (!natural) return 1;
    return Math.max(frame.width / natural.width, frame.height / natural.height);
  }, [frame.height, frame.width, natural]);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      const next = Math.min(4, Math.max(1, startScale.value * e.scale));
      scale.value = next;
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      startTx.value = tx.value;
      startTy.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = startTx.value + e.translationX;
      ty.value = startTy.value + e.translationY;
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  const imageStyle = useAnimatedStyle(() => {
    const w = (natural?.width ?? frame.width) * baseScale * scale.value;
    const h = (natural?.height ?? frame.height) * baseScale * scale.value;
    return {
      width: w,
      height: h,
      transform: [{ translateX: tx.value }, { translateY: ty.value }],
    };
  });

  const onRotate = async () => {
    if (!workingUri || busy) return;
    setBusy(true);
    try {
      const rotated = await ImageManipulator.manipulateAsync(
        workingUri,
        [{ rotate: 90 }],
        { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG }
      );
      setWorkingUri(rotated.uri);
      setNatural({ width: rotated.width, height: rotated.height });
      scale.value = 1;
      tx.value = 0;
      ty.value = 0;
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    if (!workingUri || !natural || busy) return;
    setBusy(true);
    try {
      const userScale = scale.value;
      const displayScale = baseScale * userScale;
      const displayW = natural.width * displayScale;
      const displayH = natural.height * displayScale;

      // Image centered in frame, then translated
      const imgX = frame.width / 2 - displayW / 2 + tx.value;
      const imgY = frame.height / 2 - displayH / 2 + ty.value;

      let originX = (0 - imgX) / displayScale;
      let originY = (0 - imgY) / displayScale;
      let cropW = frame.width / displayScale;
      let cropH = frame.height / displayScale;

      // Clamp to image bounds
      originX = Math.max(0, Math.min(originX, natural.width - 1));
      originY = Math.max(0, Math.min(originY, natural.height - 1));
      cropW = Math.max(32, Math.min(cropW, natural.width - originX));
      cropH = Math.max(32, Math.min(cropH, natural.height - originY));

      const cropped = await ImageManipulator.manipulateAsync(
        workingUri,
        [
          {
            crop: {
              originX: Math.round(originX),
              originY: Math.round(originY),
              width: Math.round(cropW),
              height: Math.round(cropH),
            },
          },
          { resize: { width: 1600 } },
        ],
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG }
      );
      onCropped(cropped.uri);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.root, { backgroundColor: colors.dark, paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <Pressable onPress={onCancel} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color={colors.white} />
          </Pressable>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={() => void onRotate()} hitSlop={12} style={styles.iconBtn}>
            <Ionicons name="refresh" size={22} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.hint}>
          Pinch to zoom · drag to position · fit the CNIC inside the frame
        </Text>

        <View style={styles.stage}>
          <GestureDetector gesture={gesture}>
            <View style={[styles.frame, { width: frame.width, height: frame.height }]}>
              <View style={styles.imageLayer} pointerEvents="none">
                {workingUri ? (
                  <AnimatedImage
                    source={{ uri: workingUri }}
                    style={imageStyle}
                    contentFit="fill"
                  />
                ) : null}
              </View>
              {/* Corner guides */}
              <View style={[styles.corner, styles.tl, { borderColor: colors.white }]} />
              <View style={[styles.corner, styles.tr, { borderColor: colors.white }]} />
              <View style={[styles.corner, styles.bl, { borderColor: colors.white }]} />
              <View style={[styles.corner, styles.br, { borderColor: colors.white }]} />
              <View style={[styles.frameBorder, { borderColor: colors.white }]} />
            </View>
          </GestureDetector>
        </View>

        <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.md }]}>
          <Pressable
            style={[styles.btn, styles.btnGhost]}
            onPress={onCancel}
            disabled={busy}
          >
            <Text style={styles.btnGhostText}>Retake</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnPrimary, { backgroundColor: colors.action }]}
            onPress={() => void onConfirm()}
            disabled={busy || !natural}
          >
            {busy ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.btnPrimaryText}>Use cropped CNIC</Text>
            )}
          </Pressable>
        </View>
      </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    overflow: 'hidden',
    borderRadius: Radius.md,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1.5,
    borderRadius: Radius.md,
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#fff',
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  btn: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  btnGhostText: {
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  btnPrimary: {},
  btnPrimaryText: {
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
});
