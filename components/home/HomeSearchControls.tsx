import type { ReactNode } from 'react';
import { TravelFormCard, TravelSearchButton, TravelTextField } from '@/components/ui/TravelForm';

export function HomeNameSearch({
  value,
  onChangeText,
  onSearch,
  cta,
  preferences,
  hotel,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSearch: () => void;
  cta: string;
  preferences?: ReactNode;
  hotel?: boolean;
}) {
  const submit = () => {
    if (value.trim()) onSearch();
  };
  return (
    <TravelFormCard>
      <TravelTextField
        label={hotel ? 'Hotel or destination' : 'Provider, city or vehicle'}
        value={value}
        onChangeText={onChangeText}
        placeholder={hotel ? 'Hotel name or place' : 'Where would you like to go?'}
        onSubmit={submit}
      />
      {preferences}
      <TravelSearchButton title={cta} onPress={submit} disabled={!value.trim()} />
    </TravelFormCard>
  );
}
