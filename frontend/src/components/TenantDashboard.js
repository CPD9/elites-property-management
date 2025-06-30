import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Home,
  Mail,
  MapPin,
  Phone,
  Wrench
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Layout from './Layout';
import AdminCalendar from './Calendar';
import MaintenanceRequests from './MaintenanceRequests';
import PaymentModal from './PaymentModal';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const TenantDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [specificPaymentId, setSpecificPaymentId] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const [paymentsRes, leaseRes, overdueRes, pendingRes] = await Promise.all([
        axios.get(`${API_URL}/tenants/my-payments`),
        axios.get(`${API_URL}/tenants/my-lease`),
        axios.get(`${API_URL}/payments/overdue`),
        axios.get(`${API_URL}/payments/pending`)
      ]);
      
      setPayments(paymentsRes.data);
      setLease(leaseRes.data);
      setOverduePayments(overdueRes.data.payments || []);
      setPendingPayments(pendingRes.data || []);
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN' 
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Calculate stats
  const stats = {
    totalPayments: payments.length,
    paidPayments: payments.filter(p => p.status === 'paid').length,
    overduePayments: overduePayments.length,
    totalPaid: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    totalOutstanding: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    totalOverdueAmount: overduePayments.reduce((sum, p) => sum + p.total_amount_due, 0)
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'payments', name: 'Payments', icon: CreditCard },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'lease', name: 'Lease Info', icon: Calendar }
  ];

  if (loading) {
    return (
      <Layout title="Tenant Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Loading your information...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Tenant Dashboard">
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Total
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-gray-900">
                      {stats.totalPayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Paid
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-green-600">
                      {stats.paidPayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className="text-base sm:text-lg font-medium text-red-600">
                      {stats.overduePayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg col-span-2 md:col-span-1">
            <div className="p-3 sm:p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-400" />
                </div>
                <div className="ml-3 sm:ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      Outstanding
                    </dt>
                    <dd className="text-sm sm:text-lg font-medium text-red-600 truncate">
                      {formatCurrency(stats.totalOutstanding)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alert for Overdue Payments */}
        {stats.overduePayments > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex justify-between items-center">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-medium">Attention!</span> You have {stats.overduePayments} overdue payment{stats.overduePayments > 1 ? 's' : ''} totaling {formatCurrency(stats.totalOverdueAmount)}. 
                    Late fees have been applied.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSpecificPaymentId(null); // Reset to show all overdue payments
                  setShowPaymentModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            {/* Mobile Tab Navigation */}
            <div className="sm:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md mx-4 my-2"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop Tab Navigation */}
            <nav className="hidden sm:flex -mb-px space-x-8 px-6 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 min-w-0 flex-shrink-0`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="hidden md:block">{tab.name}</span>
                    <span className="md:hidden">{tab.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Property Info Card */}
                  {lease && lease.property_name && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Home className="h-5 w-5 mr-2 text-blue-600" />
                        Your Property
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-lg font-medium text-gray-900">{lease.property_name}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-600">Type: </span>
                          <span className="ml-2 text-sm font-medium text-gray-900 capitalize">{lease.type}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-lg font-bold text-green-600">{formatCurrency(lease.rent_amount)}/month</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recent Payments Card */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <CreditCard className="h-5 w-5 mr-2 text-green-600" />
                        Recent Payments
                      </h3>
                      <button
                        onClick={() => setActiveTab('payments')}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        View All →
                      </button>
                    </div>
                    <div className="space-y-3">
                      {payments.slice(0, 3).map((payment) => (
                        <div 
                          key={payment.payment_id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div 
                            className="flex items-center flex-1 cursor-pointer"
                            onClick={() => setActiveTab('payments')}
                          >
                            {getPaymentStatusIcon(payment.payment_status)}
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">
                                {formatCurrency(payment.amount)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Due: {formatDate(payment.due_date)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(payment.payment_status)}`}>
                              {payment.payment_status}
                            </span>
                            {(payment.payment_status === 'pending' || payment.payment_status === 'overdue') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSpecificPaymentId(payment.payment_id);
                                  setShowPaymentModal(true);
                                }}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700"
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Pay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      {payments.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">No payment records found</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <Phone className="h-6 w-6 text-blue-600 mb-2" />
                      <h4 className="font-medium text-gray-900">Contact Support</h4>
                      <p className="text-sm text-gray-600">Call us for any questions</p>
                      <p className="text-sm font-medium text-blue-600">+234-800-TENANT</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <Mail className="h-6 w-6 text-green-600 mb-2" />
                      <h4 className="font-medium text-gray-900">Email Us</h4>
                      <p className="text-sm text-gray-600">Send us a message</p>
                      <p className="text-sm font-medium text-green-600">support@tenantportal.com</p>
                    </div>
                    <div className="bg-white p-4 rounded-md shadow-sm">
                      <Calendar className="h-6 w-6 text-purple-600 mb-2" />
                      <h4 className="font-medium text-gray-900">Schedule Visit</h4>
                      <p className="text-sm text-gray-600">Book a maintenance visit</p>
                      <p className="text-sm font-medium text-purple-600">Book Online</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <AdminCalendar userRole="tenant" />
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div>
                <MaintenanceRequests userRole="tenant" />
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                {/* Pending Payments Section (Not Yet Due) */}
                {pendingPayments.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-blue-800">💳 Upcoming Payments</h3>
                      <span className="text-sm text-blue-600">Pay early to avoid late fees</span>
                    </div>
                    <div className="space-y-3">
                      {pendingPayments.map((payment) => (
                        <div key={payment.id} className="bg-white rounded-lg p-4 border border-blue-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">{payment.property_name}</span>
                                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                  Due in {Math.ceil((new Date(payment.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {formatDate(payment.due_date)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <div className="text-lg font-bold text-blue-600">
                                  {formatCurrency(payment.amount)}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSpecificPaymentId(payment.id);
                                  setShowPaymentModal(true);
                                }}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                              >
                                <CreditCard className="h-3 w-3 mr-1" />
                                Pay Early
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overdue Payments Section */}
                {overduePayments.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium text-red-800">⚠️ Overdue Payments</h3>
                      <button
                        onClick={() => {
                          setSpecificPaymentId(null); // Show all overdue payments
                          setShowPaymentModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay Now
                      </button>
                    </div>
                    <div className="space-y-3">
                      {overduePayments.map((payment) => (
                        <div key={payment.id} className="bg-white rounded-lg p-4 border border-red-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="flex items-center">
                                <span className="text-sm font-medium text-gray-900">{payment.property_name}</span>
                                <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                                  {Math.floor((new Date() - new Date(payment.due_date)) / (1000 * 60 * 60 * 24))} days overdue
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Due: {formatDate(payment.due_date)}
                                {payment.late_fee > 0 && (
                                  <span className="text-red-600 ml-2">
                                    + {formatCurrency(payment.late_fee)} late fee
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-red-600">
                                {formatCurrency(payment.total_amount_due)}
                              </div>
                              {payment.late_fee > 0 && (
                                <div className="text-xs text-gray-500">
                                  Base: {formatCurrency(payment.amount)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-red-800">Total Overdue:</span>
                          <span className="text-xl font-bold text-red-600">
                            {formatCurrency(stats.totalOverdueAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <h3 className="text-lg font-medium text-gray-900">All Payment History</h3>
                
                {payments.length > 0 ? (
                  <>
                    {/* Mobile View - Cards */}
                    <div className="sm:hidden space-y-4">
                      {payments.map((payment) => (
                        <div 
                          key={payment.payment_id} 
                          className={`bg-white border rounded-lg p-4 ${payment.payment_status === 'overdue' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 text-sm">{payment.property_name}</h4>
                              <div className="flex items-center mt-1">
                                {getPaymentStatusIcon(payment.payment_status)}
                                <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(payment.payment_status)}`}>
                                  {payment.payment_status}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                {formatCurrency(payment.amount)}
                              </div>
                              {payment.payment_status === 'overdue' && (
                                <div className="text-xs text-red-600">
                                  + {formatCurrency(payment.amount * 0.05)} late fee
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Due Date:</span>
                              <span>{formatDate(payment.due_date)}</span>
                            </div>
                            {payment.payment_date && (
                              <div className="flex justify-between">
                                <span>Paid Date:</span>
                                <span>{formatDate(payment.payment_date)}</span>
                              </div>
                            )}
                            {payment.payment_reference && (
                              <div className="flex justify-between">
                                <span>Reference:</span>
                                <span className="text-xs">{payment.payment_reference}</span>
                              </div>
                            )}
                          </div>
                          
                          {(payment.payment_status === 'overdue' || payment.payment_status === 'pending') && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <button
                                onClick={() => {
                                  setSpecificPaymentId(payment.payment_id);
                                  setShowPaymentModal(true);
                                }}
                                className={`w-full inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded text-white ${
                                  payment.payment_status === 'overdue' 
                                    ? 'bg-red-600 hover:bg-red-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                              >
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Now
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {payments.map((payment) => (
                            <tr key={payment.payment_id} className={payment.payment_status === 'overdue' ? 'bg-red-50' : ''}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {payment.property_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                <div>
                                  {formatCurrency(payment.amount)}
                                  {payment.payment_status === 'overdue' && (
                                    <div className="text-xs text-red-600">
                                      + {formatCurrency(payment.amount * 0.05)} late fee
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(payment.due_date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {getPaymentStatusIcon(payment.payment_status)}
                                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(payment.payment_status)}`}>
                                    {payment.payment_status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {payment.payment_reference || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {payment.payment_status === 'overdue' ? (
                                  <button
                                    onClick={() => {
                                      setSpecificPaymentId(payment.payment_id);
                                      setShowPaymentModal(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700"
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Pay Now
                                  </button>
                                ) : payment.payment_status === 'pending' ? (
                                  <button
                                    onClick={() => {
                                      setSpecificPaymentId(payment.payment_id);
                                      setShowPaymentModal(true);
                                    }}
                                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                                  >
                                    <CreditCard className="h-3 w-3 mr-1" />
                                    Pay Now
                                  </button>
                                ) : payment.payment_status === 'paid' ? (
                                  <span className="text-green-600 text-xs">✓ Paid</span>
                                ) : (
                                  <span className="text-gray-400 text-xs">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your payment history will appear here once payments are recorded.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Lease Tab */}
            {activeTab === 'lease' && (
              <div className="space-y-6">
                {lease && lease.property_name ? (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                      Lease Agreement Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="border-b border-gray-200 pb-3">
                          <label className="text-sm font-medium text-gray-500">Property Name</label>
                          <p className="mt-1 text-lg font-semibold text-gray-900">{lease.property_name}</p>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-3">
                          <label className="text-sm font-medium text-gray-500">Property Type</label>
                          <p className="mt-1 text-base text-gray-900 capitalize">{lease.type}</p>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-3">
                          <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                          <p className="mt-1 text-xl font-bold text-green-600">{formatCurrency(lease.rent_amount)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="border-b border-gray-200 pb-3">
                          <label className="text-sm font-medium text-gray-500">Lease Start Date</label>
                          <p className="mt-1 text-base text-gray-900">{formatDate(lease.start_date)}</p>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-3">
                          <label className="text-sm font-medium text-gray-500">Lease End Date</label>
                          <p className="mt-1 text-base text-gray-900">{formatDate(lease.end_date)}</p>
                        </div>
                        
                        <div className="border-b border-gray-200 pb-3">
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <p className="mt-1">
                            <span className={`px-3 py-1 text-sm rounded-full ${
                              lease.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {lease.status}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-blue-50 rounded-md">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <Calendar className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">
                            Important Lease Information
                          </h3>
                          <div className="mt-2 text-sm text-blue-700">
                            <p>Please ensure rent payments are made by the due date each month. Late payments may incur additional fees as outlined in your lease agreement.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Home className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No lease information found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your lease details will appear here once your lease agreement is set up.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSpecificPaymentId(null); // Reset specific payment ID
          }}
          overduePayments={overduePayments}
          allPayments={payments}
          specificPaymentId={specificPaymentId}
          onPaymentSuccess={() => {
            fetchTenantData();
            setShowPaymentModal(false);
            setSpecificPaymentId(null);
            toast.success('Payments updated successfully!');
          }}
        />
      </div>
    </Layout>
  );
};

export default TenantDashboard;