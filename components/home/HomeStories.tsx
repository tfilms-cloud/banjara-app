import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import {
  ActivityIndicator,
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TravelIcon } from '@/components/ui/TravelPrimitives';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';

/** One clip inside a story. */
export type StorySlide = {
  video: VideoSource;
  caption: string;
  place?: string;
  posted: string;
};

/** One circle in the row: its clips, plus what its button does. */
export type StoryGroup = {
  id: string;
  label: string;
  image?: string;
  icon?: TravelIcon;
  coral?: boolean;
  cta: string;
  onAction: () => void;
  slides: StorySlide[];
};

/** Longest a single clip plays before moving on, in seconds. */
const MAX_SLIDE_SECONDS = 8;
const SEEN_KEY = 'banjara.stories.seen';
const RING_COLORS = ['#16B364', '#0F9B98', '#FF6B6B', '#F4B740'] as const;

function useSeenStories() {
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY)
      .then((raw) => setSeen(raw ? (JSON.parse(raw) as string[]) : []))
      .catch(() => {});
  }, []);
  const markSeen = useCallback((id: string) => {
    setSeen((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      AsyncStorage.setItem(SEEN_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);
  return { seen, markSeen };
}

/** The row of story circles at the top of Home, and the viewer they open. */
export function HomeStoriesRow({ groups }: { groups: StoryGroup[] }) {
  const theme = useHomeDesign();
  const { seen, markSeen } = useSeenStories();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.row}
      >
        {groups.map((group, index) => {
          const isSeen = seen.includes(group.id);
          return (
            <Pressable
              key={group.id}
              onPress={() => setOpenIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={`${group.label} story${isSeen ? ', watched' : ''}`}
              style={({ pressed }) => [s.item, pressed && { transform: [{ scale: 0.95 }] }]}
            >
              <LinearGradient
                colors={isSeen ? [theme.border, theme.border] : RING_COLORS}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={s.ring}
              >
                <View style={[s.ringGap, { backgroundColor: theme.background }]}>
                  <View
                    style={[
                      s.inner,
                      { backgroundColor: group.coral ? theme.coralSoft : theme.soft },
                    ]}
                  >
                    {group.image ? (
                      <Image
                        source={{ uri: group.image }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons
                        name={group.icon}
                        size={26}
                        color={group.coral ? theme.coral : theme.primary}
                      />
                    )}
                  </View>
                </View>
              </LinearGradient>
              {!isSeen ? (
                <View style={[s.newBadge, { borderColor: theme.background }]}>
                  <Text style={s.newText}>NEW</Text>
                </View>
              ) : null}
              <Text style={[s.label, { color: theme.text }]} numberOfLines={1}>
                {group.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Modal
        visible={openIndex !== null}
        animationType="fade"
        presentationStyle="overFullScreen"
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setOpenIndex(null)}
      >
        {openIndex !== null ? (
          <StoryViewer
            groups={groups}
            startIndex={openIndex}
            onSeen={markSeen}
            onClose={() => setOpenIndex(null)}
          />
        ) : null}
      </Modal>
    </>
  );
}

function StoryViewer({
  groups,
  startIndex,
  onSeen,
  onClose,
}: {
  groups: StoryGroup[];
  startIndex: number;
  onSeen: (id: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [muted, setMuted] = useState(true);
  const dragY = useRef(new Animated.Value(0)).current;

  const group = groups[groupIndex];
  const slide = group.slides[slideIndex];

  useEffect(() => onSeen(group.id), [group.id, onSeen]);

  const goNext = useCallback(() => {
    setProgress(0);
    if (slideIndex < group.slides.length - 1) setSlideIndex(slideIndex + 1);
    else if (groupIndex < groups.length - 1) {
      setGroupIndex(groupIndex + 1);
      setSlideIndex(0);
    } else onClose();
  }, [slideIndex, group.slides.length, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    setProgress(0);
    if (slideIndex > 0) setSlideIndex(slideIndex - 1);
    else if (groupIndex > 0) {
      setGroupIndex(groupIndex - 1);
      setSlideIndex(groups[groupIndex - 1].slides.length - 1);
    }
  }, [slideIndex, groupIndex, groups]);

  const jumpGroup = useCallback(
    (direction: 1 | -1) => {
      const target = groupIndex + direction;
      if (target < 0) return;
      if (target >= groups.length) return onClose();
      setProgress(0);
      setGroupIndex(target);
      setSlideIndex(0);
    },
    [groupIndex, groups.length, onClose],
  );

  // Swipe down to close, swipe sideways to change story.
  const handlers = useRef({ onClose, jumpGroup });
  handlers.current = { onClose, jumpGroup };
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 12 || Math.abs(g.dx) > 18,
        onPanResponderGrant: () => setHeld(true),
        onPanResponderMove: (_, g) => {
          if (g.dy > 0 && Math.abs(g.dy) > Math.abs(g.dx)) dragY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          setHeld(false);
          if (g.dy > 120 && Math.abs(g.dy) > Math.abs(g.dx)) {
            handlers.current.onClose();
            return;
          }
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
          if (Math.abs(g.dx) > 60 && Math.abs(g.dx) > Math.abs(g.dy)) {
            handlers.current.jumpGroup(g.dx < 0 ? 1 : -1);
          }
        },
        onPanResponderTerminate: () => {
          setHeld(false);
          Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
        },
      }),
    [dragY],
  );

  const scale = dragY.interpolate({ inputRange: [0, 400], outputRange: [1, 0.85], extrapolate: 'clamp' });
  const fade = dragY.interpolate({ inputRange: [0, 400], outputRange: [1, 0.4], extrapolate: 'clamp' });

  return (
    <Animated.View style={[s.overlay, { opacity: fade }]}>
      <StatusBar style="light" />
      <Animated.View
        style={[s.stage, { transform: [{ translateY: dragY }, { scale }] }]}
        {...pan.panHandlers}
      >
        <StoryVideo
          key={`${group.id}-${slideIndex}`}
          source={slide.video}
          paused={paused || held}
          muted={muted}
          onProgress={setProgress}
          onEnd={goNext}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={[s.shadeTop, { height: insets.top + 130 }]}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.82)']}
          style={s.shadeBottom}
          pointerEvents="none"
        />

        {/* Tap left to go back, right to go forward, hold to pause */}
        <View style={s.tapZones}>
          <Pressable
            style={{ flex: 1 }}
            onPress={goPrev}
            onLongPress={() => setHeld(true)}
            onPressOut={() => setHeld(false)}
            delayLongPress={220}
            accessibilityLabel="Previous clip"
          />
          <Pressable
            style={{ flex: 2 }}
            onPress={goNext}
            onLongPress={() => setHeld(true)}
            onPressOut={() => setHeld(false)}
            delayLongPress={220}
            accessibilityLabel="Next clip"
          />
        </View>

        <View style={[s.top, { paddingTop: insets.top + 8 }]}>
          <View style={s.bars}>
            {group.slides.map((_, index) => (
              <View key={index} style={s.bar}>
                <View
                  style={[
                    s.barFill,
                    {
                      width: `${(index < slideIndex ? 1 : index === slideIndex ? progress : 0) * 100}%`,
                    },
                  ]}
                />
              </View>
            ))}
          </View>
          <View style={s.header}>
            <View style={[s.avatar, group.coral && { borderColor: '#FF6B6B' }]}>
              {group.image ? (
                <Image source={{ uri: group.image }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Ionicons name={group.icon} size={17} color={group.coral ? '#BA3B24' : '#0F9B98'} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{group.label}</Text>
              <Text style={s.posted}>{slide.posted}</Text>
            </View>
            <Pressable
              hitSlop={8}
              style={s.control}
              onPress={() => setPaused((value) => !value)}
              accessibilityLabel={paused ? 'Play' : 'Pause'}
            >
              <Ionicons name={paused ? 'play' : 'pause'} size={20} color="#fff" />
            </Pressable>
            <Pressable
              hitSlop={8}
              style={s.control}
              onPress={() => setMuted((value) => !value)}
              accessibilityLabel={muted ? 'Unmute' : 'Mute'}
            >
              <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={20} color="#fff" />
            </Pressable>
            <Pressable hitSlop={8} style={s.control} onPress={onClose} accessibilityLabel="Close stories">
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View
          style={[s.bottom, { paddingBottom: insets.bottom + 18, opacity: held ? 0 : 1 }]}
          pointerEvents="box-none"
        >
          {slide.place ? (
            <View style={s.place}>
              <Ionicons name="location" size={12} color="#fff" />
              <Text style={s.placeText}>{slide.place}</Text>
            </View>
          ) : null}
          <Text style={s.caption}>{slide.caption}</Text>
          <Pressable
            style={({ pressed }) => [s.cta, pressed && { opacity: 0.85 }]}
            onPress={() => {
              onClose();
              group.onAction();
            }}
            accessibilityRole="button"
          >
            <Text style={s.ctaText}>{group.cta}</Text>
            <Ionicons name="arrow-forward" size={17} color="#fff" />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

/** One clip. Mounted fresh per slide so each gets its own player. */
function StoryVideo({
  source,
  paused,
  muted,
  onProgress,
  onEnd,
}: {
  source: VideoSource;
  paused: boolean;
  muted: boolean;
  onProgress: (value: number) => void;
  onEnd: () => void;
}) {
  const [ready, setReady] = useState(false);
  const ended = useRef(false);
  const player = useVideoPlayer(source, (p) => {
    p.muted = true;
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
    p.play();
  });

  const finish = () => {
    if (ended.current) return;
    ended.current = true;
    onEnd();
  };

  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') setReady(true);
    if (status === 'error') finish();
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration;
    if (!duration) return;
    const length = Math.min(duration, MAX_SLIDE_SECONDS);
    onProgress(Math.min(currentTime / length, 1));
    if (currentTime >= length) finish();
  });
  useEventListener(player, 'playToEnd', finish);

  useEffect(() => {
    player.muted = muted;
  }, [player, muted]);
  useEffect(() => {
    if (paused) player.pause();
    else player.play();
  }, [player, paused]);

  return (
    <>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
      />
      {!ready ? (
        <View style={s.loader} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 8, gap: 10 },
  item: { width: 72, alignItems: 'center' },
  ring: { width: 64, height: 64, borderRadius: 32, padding: 2.5 },
  ringGap: { flex: 1, borderRadius: 30, padding: 2.5 },
  inner: {
    flex: 1,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newBadge: {
    marginTop: -9,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: '#16B364',
  },
  newText: { color: '#fff', fontSize: 8, fontFamily: Fonts.bodyMedium, letterSpacing: 0.5 },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 10, marginTop: 4 },

  overlay: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, overflow: 'hidden', backgroundColor: '#0B1215' },
  loader: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  shadeTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  shadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  tapZones: { position: 'absolute', left: 0, right: 0, top: 110, bottom: 170, flexDirection: 'row' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 10 },
  bars: { flexDirection: 'row', gap: 4 },
  bar: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.35)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#16B364',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { color: '#fff', fontFamily: Fonts.bodyMedium, fontSize: 14 },
  posted: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  control: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18 },
  place: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 8,
  },
  placeText: { color: '#fff', fontSize: 12, fontFamily: Fonts.bodyMedium },
  caption: { color: '#fff', fontSize: 15, lineHeight: 21, marginBottom: 14 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#16B364',
  },
  ctaText: { color: '#fff', fontFamily: Fonts.bodyMedium, fontSize: 15 },
});
