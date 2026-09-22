import { Moon, Sun } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { useUserStore } from '@/store/userStore';

type AppearanceToggleProps = {
  compact?: boolean;
};

export function AppearanceToggle({ compact }: AppearanceToggleProps) {
  const colors = useThemeColors();
  const darkMode = useUserStore((state) => state.settings.darkMode);
  const updateSettings = useUserStore((state) => state.updateSettings);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding: compact ? Spacing.md : Spacing.lg,
        },
      ]}
    >
      {compact ? null : (
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.dark }]}>Appearance</Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            Switch between light and dark
          </Text>
        </View>
      )}
      <View style={[styles.track, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Pressable
          onPress={() => updateSettings({ darkMode: false })}
          style={[
            styles.option,
            !darkMode && { backgroundColor: colors.elevated, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: !darkMode }}
          accessibilityLabel="Light mode"
        >
          <Sun size={16} color={!darkMode ? colors.warning : colors.muted} strokeWidth={2} />
          <Text style={[styles.optionText, { color: !darkMode ? colors.dark : colors.muted }]}>
            Light
          </Text>
        </Pressable>
        <Pressable
          onPress={() => updateSettings({ darkMode: true })}
          style={[
            styles.option,
            darkMode && { backgroundColor: colors.elevated, borderColor: colors.border },
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: darkMode }}
          accessibilityLabel="Dark mode"
        >
          <Moon size={16} color={darkMode ? colors.primary : colors.muted} strokeWidth={2} />
          <Text style={[styles.optionText, { color: darkMode ? colors.dark : colors.muted }]}>
            Dark
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
  },
  copy: { gap: 2 },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  sub: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  track: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  optionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
});
