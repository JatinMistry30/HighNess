import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="mx-auto h-24 w-24 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                    <svg className="h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                <p className="text-gray-600 mb-6">
                    {user ? (
                        <>
                            Sorry {user.full_name}, you don't have permission to access this page.
                            <br />
                            <span className="font-medium text-gray-900">
                                Role: {user.user_type}
                            </span>
                        </>
                    ) : (
                        "You need to be logged in to access this page."
                    )}
                </p>
                
                <div className="space-y-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
                    >
                        Go to Dashboard
                    </button>
                    
                    {user && (
                        <button
                            onClick={logout}
                            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-xl font-semibold transition-colors"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Unauthorized;
