'use client';

import { useCartMerge } from '@/hooks/useCartMerge';

export function CartMergeProvider({ children }: { children: React.ReactNode }) {
  useCartMerge();
  return <>{children}</>;
}
