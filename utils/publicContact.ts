/** Public contact helpers shared by property and restaurant details. */
export function publicPhone(value?: string): string | undefined {
  const phone = value?.trim().replace(/[\s().-]/g, '');
  return phone && /^\+?\d{5,15}$/.test(phone) ? phone : undefined;
}

export function publicEmail(value?: string): string | undefined {
  const email = value?.trim();
  return email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)
    ? `mailto:${encodeURIComponent(email)}`
    : undefined;
}
