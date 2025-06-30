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
          <div className="flex justify-between items-center py-4 sm:py-6">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex items-center mr-4 sm:mr-6">
                <div className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg mr-2 sm:mr-3 shadow-sm">
                  <Building2 className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Elites</h1>
                  <p className="text-xs sm:text-sm text-indigo-600 font-medium -mt-1 hidden xs:block">Property Management</p>
                </div>
              </div>
              <div className="hidden md:block h-8 w-px bg-gray-300 mx-4"></div>
              <h2 className="hidden md:block text-xl font-semibold text-gray-700 truncate">{title}</h2>
            </div>
            
            {/* Mobile-optimized user menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* User info - hidden on small screens */}
              <div className="hidden sm:flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                  {user?.name} ({user?.role})
                </span>
              </div>
              
              {/* Settings button for tenants */}
              {user?.role === 'tenant' && (
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="inline-flex items-center px-2 py-2 sm:px-3 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Settings className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
              
              {/* Logout button */}
              <button
                onClick={logout}
                className="inline-flex items-center px-2 py-2 sm:px-3 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
          
          {/* Mobile title bar */}
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 truncate">{title}</h2>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              <span className="truncate">{user?.name} ({user?.role})</span>
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