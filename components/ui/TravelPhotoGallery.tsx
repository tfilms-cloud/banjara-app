import type { ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TravelIconAction } from './TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

/** Shared data-driven hero/field-photo gallery; no placeholder photography or document imagery. */
export function TravelPhotoGallery({
  images,
  label,
  height = 280,
  variant = 'hero',
  renderHeroOverlay,
  dotsPlacement = 'center',
}: {
  images: string[];
  label: string;
  height?: number;
  variant?: 'hero' | 'strip';
  renderHeroOverlay?: (state: {
    index: number;
    count: number;
    openPhotos: () => void;
  }) => ReactNode;
  dotsPlacement?: 'center' | 'start';
}) {
  const theme = useHomeDesign();
  const { width, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pager = useRef<ScrollViewInstance>(null);
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const photos = useMemo(
    () =>
      [
        ...new Set(images.map(normalizeMediaUrl).filter((uri): uri is string => Boolean(uri))),
      ].filter((uri) => !failed[uri]),
    [images, failed],
  );
  const active = Math.min(index, Math.max(photos.length - 1, 0));
  const change = (next: number) => {
    setIndex(next);
    pager.current?.scrollTo({ x: next * width, animated: true });
  };
  useEffect(() => {
    pager.current?.scrollTo({ x: active * width, animated: false });
  }, [photos.length, width]);
  const fail = (uri: string) => setFailed((previous) => ({ ...previous, [uri]: true }));

  return (
    <>
      {variant === 'strip' ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.strip}
        >
          {photos.map((uri, position) => (
            <Pressable
              key={uri}
              accessibilityRole="imagebutton"
              accessibilityLabel={`${label} photo ${position + 1}`}
              onPress={() => {
                setIndex(position);
                setOpen(true);
              }}
              style={[s.thumbnail, { backgroundColor: theme.field }]}
            >
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                onError={() => fail(uri)}
              />
            </Pressable>
          ))}
          {!photos.length ? (
            <Text style={[s.emptyText, { color: theme.muted }]}>No photos available</Text>
          ) : null}
        </ScrollView>
      ) : (
        <View style={{ width, height, backgroundColor: theme.field }}>
          {photos.length ? (
            <ScrollView
              ref={pager}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) =>
                setIndex(
                  Math.max(
                    0,
                    Math.min(
                      photos.length - 1,
                      Math.round(event.nativeEvent.contentOffset.x / width),
                    ),
                  ),
                )
              }
            >
              {photos.map((uri, position) => (
                <Pressable
                  key={uri}
                  accessibilityRole="imagebutton"
                  accessibilityLabel={`${label} photo ${position + 1}`}
                  onPress={() => {
                    setIndex(position);
                    setOpen(true);
                  }}
                  style={{ width, height }}
                >
                  <Image
                    source={{ uri }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    onError={() => fail(uri)}
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <View style={s.empty}>
              <Ionicons name="images-outline" size={44} color={theme.primary} />
              <Text style={[s.emptyText, { color: theme.muted }]}>No photos uploaded yet</Text>
            </View>
          )}
          {renderHeroOverlay ? (
            <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
              {renderHeroOverlay({
                index: active,
                count: photos.length,
                openPhotos: () => setOpen(true),
              })}
            </View>
          ) : null}
          {photos.length > 1 ? (
            <View
              style={[
                s.dots,
                dotsPlacement === 'start' && {
                  left: 8,
                  bottom: 24,
                  alignSelf: 'auto',
                  backgroundColor: 'transparent',
                },
              ]}
            >
              {photos
                .slice(Math.max(0, active - 2), Math.max(0, active - 2) + 5)
                .map((uri, offset) => {
                  const position = Math.max(0, active - 2) + offset;
                  return (
                    <Pressable
                      key={uri}
                      accessibilityRole="button"
                      accessibilityLabel={`${label} select photo ${position + 1}`}
                      accessibilityState={{ selected: position === active }}
                      onPress={() => change(position)}
                      style={s.dotButton}
                    >
                      <View
                        style={[
                          s.dot,
                          position === active && {
                            width: 20,
                            backgroundColor: dotsPlacement === 'start' ? '#99e6dc' : '#FFFFFF',
                          },
                        ]}
                      />
                    </Pressable>
                  );
                })}
            </View>
          ) : null}
        </View>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {open ? <StatusBar style="light" /> : null}
        <View accessibilityViewIsModal style={s.modal}>
          <View style={[s.modalHeader, { paddingTop: insets.top + 12 }]}>
            <Text
              style={{ color: '#FFFFFF', fontFamily: Fonts.bodySemiBold, fontSize: 14, flex: 1 }}
            >
              {label}
              {photos.length ? ` · ${active + 1} / ${photos.length}` : ''}
            </Text>
            <TravelIconAction
              icon="close"
              label={`Close ${label} photos`}
              color="#FFFFFF"
              onPress={() => setOpen(false)}
            />
          </View>
          {photos[active] ? (
            <Image
              source={{ uri: photos[active] }}
              style={{ width, height: screenHeight * 0.65 }}
              contentFit="contain"
              accessibilityLabel={`${label} enlarged photo ${active + 1}`}
              onError={() => fail(photos[active])}
            />
          ) : (
            <Text style={{ color: '#FFFFFF' }}>No photos available</Text>
          )}
          {photos.length > 1 ? (
            <View style={s.controls}>
              <TravelIconAction
                icon="chevron-back"
                label={`Previous ${label} photo`}
                color="#FFFFFF"
                onPress={() => change((active - 1 + photos.length) % photos.length)}
              />
              <TravelIconAction
                icon="chevron-forward"
                label={`Next ${label} photo`}
                color="#FFFFFF"
                onPress={() => change((active + 1) % photos.length)}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  strip: { gap: 10 },
  thumbnail: { width: 120, height: 92, borderRadius: 18, overflow: 'hidden' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 19 },
  dots: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    flexDirection: 'row',
    borderRadius: 24,
    backgroundColor: 'rgba(7,27,29,0.24)',
  },
  dotButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)' },
  modal: {
    flex: 1,
    backgroundColor: '#128a4c',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  modalHeader: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  controls: { flexDirection: 'row', gap: 24 },
});
