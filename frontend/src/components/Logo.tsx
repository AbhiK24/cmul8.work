import { Link } from 'react-router-dom';

interface LogoProps {
  linkTo?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ linkTo = '/', className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: { img: 'h-4', text: 'text-sm', dot: 'text-[8px]' },
    md: { img: 'h-5', text: 'text-base', dot: 'text-[10px]' },
    lg: { img: 'h-6', text: 'text-lg', dot: 'text-xs' },
  };

  const logoElement = (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.svg"
        alt="cmul8"
        className={`${sizes[size].img} w-auto`}
      />
      <span className={`font-semibold tracking-tight text-dark ${sizes[size].text}`}>
        CMUL8<span className={`${sizes[size].dot} align-super mx-px`}>.</span>WORK
      </span>
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-70 transition-opacity">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
