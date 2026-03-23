import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface LogoProps {
  linkTo?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ linkTo, className = '', size = 'md' }: LogoProps) {
  const { token, userType } = useAuth();

  const sizes = {
    sm: { img: 'h-4', text: 'text-sm', dot: 'text-[8px]' },
    md: { img: 'h-5', text: 'text-base', dot: 'text-[10px]' },
    lg: { img: 'h-6', text: 'text-lg', dot: 'text-xs' },
  };

  // Determine link destination based on auth state
  let destination = linkTo;
  if (destination === undefined) {
    if (token) {
      // Signed-in users go to their dashboard
      destination = userType === 'b2c' ? '/practice' : '/dashboard';
    } else {
      destination = '/';
    }
  }

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

  if (destination) {
    return (
      <Link to={destination} className="hover:opacity-70 transition-opacity">
        {logoElement}
      </Link>
    );
  }

  return logoElement;
}
