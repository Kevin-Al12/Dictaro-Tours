import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  href?: string;
}

const sizes = {
  sm: { w: 36, h: 36, text: 'text-base' },
  md: { w: 48, h: 48, text: 'text-xl'  },
  lg: { w: 72, h: 72, text: 'text-3xl'  },
};

export default function Logo({ size = 'md', showTagline = false, href = '/' }: LogoProps) {
  const { w, h, text } = sizes[size];

  const content = (
    <div className="flex items-center gap-3 select-none">
      <div
        className="relative shrink-0 rounded-full overflow-hidden"
        style={{ width: w, height: h }}
      >
        <Image
          src="/images/logo.png"
          alt="D'Itaros Tours logo"
          width={w}
          height={h}
          className="object-contain w-full h-full"
          priority
        />
      </div>
      <div>
        <p className={`font-display font-bold text-white leading-tight ${text}`}>
          D'<span className="text-brand-400">Itaros</span> Tours
        </p>
        {showTagline && (
          <p className="text-[10px] text-white/50 tracking-wider mt-0.5 uppercase">
            Agencia de viajes y excursiones
          </p>
        )}
      </div>
    </div>
  );

  if (!href) return content;
  return <Link href={href}>{content}</Link>;
}
