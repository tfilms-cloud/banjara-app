/**
 * Compatibility wrapper — prefer ScreenHeader for new screens.
 */
import type { Href } from 'expo-router';
import type { ReactNode } from 'react';
import { ScreenHeader } from '@/components/navigation/ScreenHeader';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  fallbackHref?: Href;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
  light?: boolean;
}

export function Header({
  title,
  subtitle,
  showBack,
  fallbackHref,
  onBack,
  right,
  transparent,
  light,
}: HeaderProps) {
  return (
    <ScreenHeader
      title={title.trim() ? title : undefined}
      subtitle={subtitle}
      showBack={showBack}
      fallbackHref={fallbackHref}
      onBack={onBack}
      right={right}
      transparent={transparent}
      light={light}
    />
  );
}
