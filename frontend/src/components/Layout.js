import { LogOut, Settings, User, Building2 } from 'lucide-react';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TenantSettings from './TenantSettings';

const Layout = ({ children, title }) => {
  const { user, logout } = useAuth();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg mr-3 shadow-sm">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Elites</h1>
                  <p className="text-sm text-indigo-600 font-medium -mt-1">Property Management</p>
                </div>
              </div>
              <div className="hidden md:block h-8 w-px bg-gray-300 mx-4"></div>
              <h2 className="hidden md:block text-xl font-semibold text-gray-700">{title}</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.name} ({user?.role})
                </span>
              </div>
              {user?.role === 'tenant' && (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </button>
              )}
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>

      {/* Tenant Settings Modal */}
      {user?.role === 'tenant' && (
        <TenantSettings
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          user={user}
        />
      )}
    </div>
  );
};

export default Layout;