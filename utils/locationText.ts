/** Follow the address language without changing the layout direction of the whole screen. */
export function isRtlLocationText(value: string): boolean {
  const rtl = value.match(/[\u0590-\u08ff\ufb1d-\ufdfd\ufe70-\ufefc]/g)?.length ?? 0;
  const latin = value.match(/[a-z]/gi)?.length ?? 0;
  return rtl > latin;
}
