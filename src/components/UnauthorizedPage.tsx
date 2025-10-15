import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from './ProtectedRoute';

interface UnauthorizedPageProps {
  requiredRole?: string;
  message?: string;
  showLoginButton?: boolean;
  onGoBack?: () => void;
}

export function UnauthorizedPage({
  requiredRole,
  message,
  showLoginButton = true,
  onGoBack,
}: UnauthorizedPageProps) {
  const { logout } = useAuth();
  const { user } = usePermissions();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      window.history.back();
    }
  };

  const handleLoginAsAnother = async () => {
    try {
      await logout();
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/admin/login';
    }
  };

  const defaultMessage = requiredRole
    ? `このページにアクセスするには ${requiredRole} 権限が必要です。`
    : 'このページにアクセスする権限がありません。';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        {/* Content */}
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            アクセスが拒否されました
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {message || defaultMessage}
          </p>

          {user && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <p className="text-sm text-gray-700">
                現在ログイン中のユーザー:{' '}
                <span className="font-medium">{user.name}</span>
              </p>
              <p className="text-sm text-gray-700">
                現在の権限:{' '}
                <span className="font-medium capitalize">{user.role}</span>
              </p>
              {requiredRole && (
                <p className="text-sm text-gray-700">
                  必要な権限:{' '}
                  <span className="font-medium capitalize">{requiredRole}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            戻る
          </button>

          {showLoginButton && (
            <button
              onClick={handleLoginAsAnother}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              別のユーザーでログイン
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-xs text-gray-500">
          <p>
            誤ってこの画面が表示される場合は、管理者へお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}
