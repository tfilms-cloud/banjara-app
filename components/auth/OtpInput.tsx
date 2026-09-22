import { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { AuthFonts } from '@/constants/authFonts';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ length = 6, value, onChange }: OtpInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length }, (_, index) => value[index] ?? '');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const setDigit = (index: number, char: string) => {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join('').replace(/\D/g, '').slice(0, length);
    onChange(joined);
    if (char && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const onKeyPress = (index: number, event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (event.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
      setDigit(index - 1, '');
    }
  };

  return (
    <View style={styles.row} accessibilityLabel="Verification code">
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          value={digit}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '');
            if (cleaned.length > 1) {
              const pasted = cleaned.slice(0, length);
              onChange(pasted);
              const focusAt = Math.min(pasted.length, length - 1);
              refs.current[focusAt]?.focus();
              return;
            }
            setDigit(index, cleaned.slice(-1));
          }}
          onKeyPress={(event) => onKeyPress(index, event)}
          onFocus={() => setFocusedIndex(index)}
          keyboardType="number-pad"
          maxLength={length}
          textContentType="oneTimeCode"
          style={[styles.cell, focusedIndex === index && styles.cellFocused]}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cell: {
    flex: 1,
    minHeight: 58,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
    textAlign: 'center',
    fontFamily: AuthFonts.displayBold,
    fontSize: 24,
    color: Colors.primary,
  },
  cellFocused: {
    borderColor: Colors.action,
    backgroundColor: Colors.card,
  },
});
