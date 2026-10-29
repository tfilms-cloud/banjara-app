import { Input } from '@/components/ui/Input';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { YES_NO_OPTIONS } from '@/constants/providerOptions';
import type { ProviderTransportSetup } from '@/types/provider';

export function VehicleVerificationFields({
  value,
  onChange,
}: {
  value: Partial<ProviderTransportSetup>;
  onChange: (patch: Partial<ProviderTransportSetup>) => void;
}) {
  return (
    <>
      {(
        [
          ['ownerName', 'Vehicle owner name *', 'default'],
          ['engineNumber', 'Engine number *', 'default'],
          ['driverName', 'Driver name *', 'default'],
          ['driverPhone', 'Driver phone number *', 'phone-pad'],
          ['driverEmail', 'Driver email (optional)', 'email-address'],
          ['driverPermanentAddress', 'Driver permanent address *', 'default'],
          ['driverCnic', 'Driver CNIC (13 digits) *', 'number-pad'],
          ['driverLicenseNumber', 'Driver license number *', 'default'],
          [
            'driverExperienceYears',
            'Driver experience (years) *',
            'number-pad',
          ],
          ['driverEmergencyContact', 'Emergency contact number *', 'phone-pad'],
        ] as const
      ).map(([key, label, keyboardType]) => (
        <Input
          key={key}
          label={label}
          value={String(value[key] ?? '')}
          keyboardType={keyboardType}
          autoCapitalize={key === 'driverEmail' ? 'none' : undefined}
          onChangeText={(text) => onChange({ [key]: text })}
        />
      ))}
      <SearchSelect
        label="Vehicle insurance *"
        value={value.hasInsurance ?? ''}
        options={YES_NO_OPTIONS}
        searchable={false}
        onChange={(hasInsurance) =>
          onChange({ hasInsurance: hasInsurance as 'yes' | 'no' })
        }
      />
      {(
        [
          ['insuranceCompany', 'Insurance company *'],
          ['insuranceNumber', 'Insurance policy number *'],
          ['insuranceYear', 'Insurance year *'],
        ] as const
      ).map(([key, label]) => (
        <Input
          key={key}
          label={label}
          value={value[key] ?? ''}
          keyboardType={key === 'insuranceYear' ? 'number-pad' : 'default'}
          onChangeText={(text) => onChange({ [key]: text })}
        />
      ))}
    </>
  );
}
