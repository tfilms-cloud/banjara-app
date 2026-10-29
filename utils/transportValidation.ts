import type { ProviderTransportSetup } from '@/types/provider';

export function vehicleVerificationError(
  details: Partial<ProviderTransportSetup>,
): string | null {
  const labels: Partial<Record<keyof ProviderTransportSetup, string>> = {
    ownerName: 'Vehicle owner name',
    vehicleModel: 'Vehicle model',
    engineNumber: 'Engine number',
    registrationNumber: 'Registration number',
    driverName: 'Driver name',
    driverPermanentAddress: 'Driver permanent address',
    driverLicenseNumber: 'Driver license number',
    insuranceCompany: 'Insurance company',
    insuranceNumber: 'Insurance policy number',
  };
  for (const [key, label] of Object.entries(labels))
    if (!String(details[key as keyof ProviderTransportSetup] ?? '').trim())
      return `${label} is required.`;
  const validYear = (value?: string) =>
    /^\d{4}$/.test(value ?? '') &&
    Number(value) >= 1980 &&
    Number(value) <= new Date().getFullYear() + 1;
  const validPhone = (value?: string) =>
    /^\+?\d{10,15}$/.test((value ?? '').replace(/[\s()-]/g, ''));
  if (!validYear(details.vehicleMakeYear))
    return 'Enter a valid vehicle model year.';
  if (!validPhone(details.driverPhone))
    return 'Enter a valid driver phone number (10–15 digits).';
  if (!validPhone(details.driverEmergencyContact))
    return 'Enter a valid emergency contact (10–15 digits).';
  if ((details.driverCnic ?? '').replace(/\D/g, '').length !== 13)
    return 'Driver CNIC must contain 13 digits.';
  if (
    details.driverEmail?.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.driverEmail.trim())
  )
    return 'Enter a valid driver email.';
  if (details.hasInsurance !== 'yes')
    return 'Valid vehicle insurance is required before you can continue.';
  if (!validYear(details.insuranceYear)) return 'Enter a valid insurance year.';
  if (
    !/^\d+$/.test(details.driverExperienceYears ?? '') ||
    Number(details.driverExperienceYears) > 80
  )
    return 'Driver experience must be a whole number from 0 to 80.';
  if (
    !/^https?:\/\//i.test(details.vehicleImageFront ?? '') ||
    !/^https?:\/\//i.test(details.vehicleImageBack ?? '')
  )
    return 'Upload both front and back vehicle photos.';
  return null;
}
