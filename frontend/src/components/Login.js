import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Home, Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, user } = useAuth();

  // Redirect if already logged in
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/tenant'} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex">
      {/* Left Panel - Branding & 3D House */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 xl:px-12">
        <div className="mx-auto max-w-xl">
          {/* Logo and Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl mb-6 shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Elites</h1>
            <p className="text-xl text-indigo-600 font-semibold">Property Management</p>
          </div>

          {/* 3D Floating House Animation */}
          <div className="relative mx-auto w-80 h-80 mb-8">
            <div className="absolute inset-0 animate-float">
              {/* House Structure */}
              <div className="relative w-full h-full">
                {/* House Base */}
                <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-48 h-32 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg shadow-2xl">
                  {/* Roof */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-28 border-r-28 border-b-16 border-l-transparent border-r-transparent border-b-indigo-500"></div>
                  
                  {/* Door */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-16 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg">
                    <div className="absolute top-4 right-1 w-1 h-1 bg-yellow-400 rounded-full"></div>
                  </div>
                  
                  {/* Windows */}
                  <div className="absolute top-6 left-4 w-8 h-8 bg-gradient-to-br from-sky-200 to-sky-300 rounded border-2 border-white shadow-inner">
                    <div className="absolute inset-1 border border-white/50"></div>
                  </div>
                  <div className="absolute top-6 right-4 w-8 h-8 bg-gradient-to-br from-sky-200 to-sky-300 rounded border-2 border-white shadow-inner">
                    <div className="absolute inset-1 border border-white/50"></div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-8 left-12 w-4 h-4 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
                <div className="absolute top-20 right-16 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                <div className="absolute bottom-8 left-8 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                
                {/* Cloud */}
                <div className="absolute top-4 right-8 flex items-center">
                  <div className="w-8 h-6 bg-white rounded-full opacity-80"></div>
                  <div className="w-6 h-4 bg-white rounded-full -ml-2 opacity-80"></div>
                  <div className="w-10 h-6 bg-white rounded-full -ml-3 opacity-80"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center text-gray-700">
              <Home className="h-5 w-5 text-indigo-600 mr-3" />
              <span className="text-sm">Comprehensive Property Management</span>
            </div>
            <div className="flex items-center text-gray-700">
              <User className="h-5 w-5 text-indigo-600 mr-3" />
              <span className="text-sm">Tenant Portal & Admin Dashboard</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Building2 className="h-5 w-5 text-indigo-600 mr-3" />
              <span className="text-sm">Integrated Payment Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile Branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl mb-4 shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Elites Property Management</h1>
          </div>

          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to access your{' '}
              <span className="font-medium text-indigo-600">property management portal</span>
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-3.5" />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to your account'
                  )}
                </button>
              </div>
            </form>

            {/* Test Credentials Info */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Test Credentials:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Admin:</strong> admin@tenantmanagement.com / admin123</p>
                <p><strong>Tenant:</strong> test@tenant.com / tenant123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;