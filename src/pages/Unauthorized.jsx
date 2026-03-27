import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                <div className="flex justify-center">
                   <svg className="h-24 w-24 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-4xl font-bold text-gray-800 mt-4">Unauthorized</h1>
                <h2 className="text-xl font-medium text-gray-600 mt-2">Access Denied</h2>
                <p className="text-gray-500 mt-4">
                    You do not have permission to view this page. Please contact your administrator if you believe this is an error.
                </p>
                <div className="mt-8 flex flex-col space-y-3">
                    <Link
                        to="/"
                        className="inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 transition-colors duration-200"
                    >
                        Return Home
                    </Link>
                    <Link
                        to="/login"
                        className="text-sm font-medium text-red-600 hover:text-red-500 transition-colors duration-200"
                    >
                        Sign in as a different user
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
