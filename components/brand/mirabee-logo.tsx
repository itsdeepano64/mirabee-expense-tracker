'use client';

import Image from 'next/image';

interface MirabeeLogoProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'hero';
  /** Show the text wordmark beside/below the image */
  showWordmark?: boolean;
  /** Layout direction when wordmark is shown */
  direction?: 'row' | 'column';
  className?: string;
}

const sizes = {
  sm:   { img: 28, wordmark: 13 },
  md:   { img: 36, wordmark: 14 },
  lg:   { img: 52, wordmark: 16 },
  hero: { img: 90, wordmark: 22 },
};

export function MirabeeLogo({
  size = 'md',
  showWordmark = true,
  direction = 'row',
  className = '',
}: MirabeeLogoProps) {
  const { img, wordmark } = sizes[size];
  const isRow = direction === 'row';

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
        alignItems: 'center',
        gap: isRow ? 9 : 8,
      }}
    >
      {/* Logo image — white-background version looks best in app context */}
      <div
        style={{
          width: img,
          height: img,
          borderRadius: size === 'hero' ? 24 : size === 'lg' ? 18 : 10,
          overflow: 'hidden',
          flexShrink: 0,
          border: size === 'hero'
            ? '2px solid var(--mb-blue-light)'
            : '1px solid var(--mb-border)',
          background: '#fff',
        }}
      >
        <Image
          src="/mirabee-flowers-logo.png"
          alt="Mirabee Flowers logo"
          width={img}
          height={img}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          unoptimized
          priority={size === 'hero'}
        />
      </div>

      {showWordmark && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span
            style={{
              fontSize: wordmark,
              fontWeight: 800,
              color: 'var(--mb-text)',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              textAlign: direction === 'column' ? 'center' : 'left',
            }}
          >
            Mirabee Flowers
          </span>
          {(size === 'md' || size === 'sm') && (
            <span
              style={{
                fontSize: 10,
                color: 'var(--mb-text-muted)',
                fontWeight: 500,
                textAlign: direction === 'column' ? 'center' : 'left',
              }}
            >
              Expense Tracker
            </span>
          )}
        </div>
      )}
    </div>
  );
}
