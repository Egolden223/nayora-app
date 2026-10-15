/** Runtime guards for arrays that may be missing on partial profiles. */
export function asArray<T>(v: T[] | null | undefined): T[] {
  return Array.isArray(v) ? v : [];
}
