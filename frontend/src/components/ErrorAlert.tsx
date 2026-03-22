/**
 * Error alert component with color-coded messages and actionable fixes.
 */

export type ErrorType = 'error' | 'warning' | 'info';

export interface ParsedError {
  type: ErrorType;
  title: string;
  message: string;
  fix?: string;
}

/**
 * Parse an error into a user-friendly format with actionable fixes.
 */
export function parseError(error: unknown, statusCode?: number): ParsedError {
  const errorStr = error instanceof Error ? error.message : String(error);
  const lowerError = errorStr.toLowerCase();

  // Network/Connection errors
  if (lowerError.includes('failed to fetch') || lowerError.includes('network')) {
    return {
      type: 'error',
      title: 'Connection Failed',
      message: 'Unable to reach the server.',
      fix: 'Check your internet connection and try again.',
    };
  }

  // Authentication errors
  if (statusCode === 401 || lowerError.includes('unauthorized') || lowerError.includes('token')) {
    return {
      type: 'warning',
      title: 'Session Expired',
      message: 'Your login session has expired.',
      fix: 'Please log in again to continue.',
    };
  }

  // Validation errors
  if (statusCode === 400 || statusCode === 422) {
    if (lowerError.includes('email')) {
      return {
        type: 'warning',
        title: 'Invalid Email',
        message: 'The email address format is incorrect.',
        fix: 'Enter a valid email address (e.g., name@company.com).',
      };
    }
    if (lowerError.includes('json') || lowerError.includes('data')) {
      return {
        type: 'error',
        title: 'Invalid Request',
        message: 'The form data could not be processed.',
        fix: 'Refresh the page and try again.',
      };
    }
    if (lowerError.includes('pdf') || lowerError.includes('file')) {
      return {
        type: 'warning',
        title: 'Invalid File',
        message: 'The uploaded file could not be processed.',
        fix: 'Ensure the file is a valid PDF under 10MB.',
      };
    }
    return {
      type: 'warning',
      title: 'Validation Error',
      message: errorStr,
      fix: 'Check your inputs and try again.',
    };
  }

  // Rate limiting
  if (statusCode === 429) {
    return {
      type: 'warning',
      title: 'Too Many Requests',
      message: 'You\'re creating simulations too quickly.',
      fix: 'Wait a moment before trying again.',
    };
  }

  // Server errors
  if (statusCode === 500 || lowerError.includes('internal server')) {
    return {
      type: 'error',
      title: 'Server Error',
      message: 'Something went wrong on our end.',
      fix: 'Try again in a few moments. If the problem persists, contact support.',
    };
  }

  // Timeout errors
  if (statusCode === 504 || lowerError.includes('timeout') || lowerError.includes('timed out')) {
    return {
      type: 'warning',
      title: 'Request Timeout',
      message: 'The simulation is taking longer than expected to generate.',
      fix: 'Try again with a simpler configuration, or wait and retry.',
    };
  }

  // Service unavailable
  if (statusCode === 503) {
    return {
      type: 'error',
      title: 'Service Unavailable',
      message: 'The simulation service is temporarily unavailable.',
      fix: 'Please try again in a few minutes.',
    };
  }

  // Profile/org errors
  if (lowerError.includes('profile') || lowerError.includes('org')) {
    return {
      type: 'warning',
      title: 'Profile Incomplete',
      message: 'Your organization profile is missing required information.',
      fix: 'Complete your organization profile in Settings before creating simulations.',
    };
  }

  // Generic fallback
  return {
    type: 'error',
    title: 'Something Went Wrong',
    message: errorStr || 'An unexpected error occurred.',
    fix: 'Please try again. If the problem continues, contact support.',
  };
}

interface ErrorAlertProps {
  error: ParsedError;
  onDismiss?: () => void;
}

export default function ErrorAlert({ error, onDismiss }: ErrorAlertProps) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-500',
      title: 'text-red-800',
      message: 'text-red-700',
      fix: 'text-red-600',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-500',
      title: 'text-amber-800',
      message: 'text-amber-700',
      fix: 'text-amber-600',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-500',
      title: 'text-blue-800',
      message: 'text-blue-700',
      fix: 'text-blue-600',
    },
  };

  const s = styles[error.type];

  const icons = {
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`${s.bg} ${s.border} border rounded-lg p-4 mb-6`}>
      <div className="flex gap-3">
        <div className={`${s.icon} flex-shrink-0 mt-0.5`}>
          {icons[error.type]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`${s.title} font-semibold text-sm`}>{error.title}</h4>
          <p className={`${s.message} text-sm mt-1`}>{error.message}</p>
          {error.fix && (
            <p className={`${s.fix} text-xs mt-2 font-medium`}>
              {error.fix}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`${s.icon} flex-shrink-0 hover:opacity-70 transition-opacity`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
