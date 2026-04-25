'use client';

import { Bouncy } from 'ldrs/react';
import 'ldrs/react/Bouncy.css';

export default function BouncyLoader({ color = '#64748b', size = 45 }: { color?: string; size?: number }) {
  return <Bouncy size={String(size)} speed="1.75" color={color} />;
}
