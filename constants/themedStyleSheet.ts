import { StyleSheet as RNStyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import { DarkColors, LightColors, type ColorTokens } from '@/constants/colors';
import { getCachedDarkMode } from '@/utils/themeModeCache';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

function invert(from: ColorTokens, to: ColorTokens): Record<string, string> {
  const map: Record<string, string> = {};
  (Object.keys(from) as (keyof ColorTokens)[]).forEach((key) => {
    if (from[key] !== to[key]) {
      map[from[key]] = to[key];
    }
  });
  return map;
}

const darkToLight = invert(DarkColors, LightColors);
const lightToDark = invert(LightColors, DarkColors);

const uniqueDark = new Set(
  (Object.values(DarkColors) as string[]).filter(
    (value) => !(Object.values(LightColors) as string[]).includes(value)
  )
);
const uniqueLight = new Set(
  (Object.values(LightColors) as string[]).filter(
    (value) => !(Object.values(DarkColors) as string[]).includes(value)
  )
);

function collectStrings(input: unknown, out: string[]) {
  if (typeof input === 'string') {
    out.push(input);
    return;
  }
  if (Array.isArray(input)) {
    input.forEach((item) => collectStrings(item, out));
    return;
  }
  if (input && typeof input === 'object') {
    Object.values(input).forEach((item) => collectStrings(item, out));
  }
}

function isDarkSnapshot(styles: unknown): boolean {
  const hexes: string[] = [];
  collectStrings(styles, hexes);
  let darkHits = 0;
  let lightHits = 0;
  for (const hex of hexes) {
    if (uniqueDark.has(hex)) darkHits += 1;
    if (uniqueLight.has(hex)) lightHits += 1;
  }
  if (darkHits === 0 && lightHits === 0) {
    return false;
  }
  return darkHits >= lightHits;
}

function remap(value: unknown, map: Record<string, string>): unknown {
  if (typeof value === 'string') return map[value] ?? value;
  if (Array.isArray(value)) return value.map((item) => remap(item, map));
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      next[key] = remap(item, map);
    }
    return next;
  }
  return value;
}

const originalCreate = RNStyleSheet.create.bind(RNStyleSheet);

function createThemed<T extends NamedStyles<T> | NamedStyles<any>>(styles: T): T {
  const darkSource = (isDarkSnapshot(styles) ? styles : remap(styles, lightToDark)) as T;
  const lightSource = remap(darkSource, darkToLight) as T;
  const dark = originalCreate(darkSource);
  const light = originalCreate(lightSource);
  const themed = {} as T;
  (Object.keys(styles) as (keyof T)[]).forEach((key) => {
    Object.defineProperty(themed, key, {
      enumerable: true,
      get() {
        return getCachedDarkMode() ? dark[key] : light[key];
      },
    });
  });
  return themed;
}

const patched = RNStyleSheet as typeof RNStyleSheet & { __banjaraThemed?: boolean };
if (!patched.__banjaraThemed) {
  patched.create = createThemed as typeof RNStyleSheet.create;
  patched.__banjaraThemed = true;
}

export const StyleSheet = RNStyleSheet;
