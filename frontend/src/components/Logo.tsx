import { Link } from 'react-router-dom';

interface LogoProps {
  linkTo?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ linkTo = '/', className = '', size = 'md' }: LogoProps) {
  const sizes = {
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
  };

  const logoElement = (
    <img
      src="/logo.svg"
      alt="cmul8"
      className={`${sizes[size]} w-auto ${className}`}
    />
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
