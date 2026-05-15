import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Large 404 number */}
        <h1 className="text-8xl font-extrabold text-blue-600/20 dark:text-blue-400/20 select-none">
          404
        </h1>

        {/* Message */}
        <h2 className="mt-2 text-2xl font-bold text-slate-800 dark:text-white">
          Page not found
        </h2>
        <p className="mt-3 text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go Home
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
