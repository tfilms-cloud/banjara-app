import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Fonts, Typography } from '@/constants/typography';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { useHomeDesign } from '@/constants/homeDesign';

type ExpandableTextProps = {
  text: string;
  numberOfLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
};

export function ExpandableText({
  text,
  numberOfLines = 4,
  expandLabel = 'Read more',
  collapseLabel = 'Show less',
}: ExpandableTextProps) {
  const travel = useTravelPresentation();
  const theme = useHomeDesign();
  const [expanded, setExpanded] = useState(false);
  const [lineCount, setLineCount] = useState(0);
  const trimmed = text.trim();
  if (!trimmed) return null;

  const truncated = lineCount > numberOfLines;

  return (
    <View>
      <Text
        style={[
          styles.body,
          styles.measure,
          travel && { color: theme.muted, fontSize: 13, lineHeight: 21 },
        ]}
        onTextLayout={(event) => setLineCount(event.nativeEvent.lines.length)}
      >
        {trimmed}
      </Text>
      <Text
        style={[styles.body, travel && { color: theme.muted, fontSize: 13, lineHeight: 21 }]}
        numberOfLines={expanded ? undefined : numberOfLines}
      >
        {trimmed}
      </Text>
      {truncated ? (
        <Pressable
          onPress={() => setExpanded((value) => !value)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={expanded ? collapseLabel : expandLabel}
          style={travel ? { minHeight: 44, justifyContent: 'center' } : undefined}
        >
          <Text style={[styles.toggle, travel && { color: theme.primary, fontSize: 12 }]}>
            {expanded ? collapseLabel : expandLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    ...Typography.body,
    color: Colors.muted,
    lineHeight: 22,
  },
  measure: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
  },
  toggle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.action,
    marginTop: 6,
  },
});
