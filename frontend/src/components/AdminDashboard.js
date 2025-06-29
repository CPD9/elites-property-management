import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle,
  CreditCard,
  DollarSign,
  Edit,
  Home,
  Mail,
  Plus,
  Trash2,
  Users,
  Wrench
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Layout from './Layout';
import AdminCalendar from './Calendar';
import MaintenanceRequests from './MaintenanceRequests';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [reminderDays, setReminderDays] = useState(3);
  const [upcomingPayments, setUpcomingPayments] = useState([]);

  // Form states
  const [tenantForm, setTenantForm] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [propertyForm, setPropertyForm] = useState({
    name: '', type: '', rent_amount: '', description: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    user_id: '', property_id: '', amount: '', due_date: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [tenantsRes, propertiesRes, paymentsRes, upcomingRes] = await Promise.all([
        axios.get(`${API_URL}/admin/tenants`),
        axios.get(`${API_URL}/admin/properties`),
        axios.get(`${API_URL}/admin/payments`),
        axios.get(`${API_URL}/admin/upcoming-payments?days_ahead=${reminderDays}`)
      ]);
      
      setTenants(tenantsRes.data);
      setProperties(propertiesRes.data);
      setPayments(paymentsRes.data);
      setUpcomingPayments(upcomingRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
      } else {
        alert('Error loading data: ' + (error.response?.data?.message || error.message));
      }
    }
    setIsLoading(false);
  };

  // Add effect to refetch upcoming payments when reminderDays changes
  useEffect(() => {
    const fetchUpcomingPayments = async () => {
      try {
        const response = await axios.get(`${API_URL}/admin/upcoming-payments?days_ahead=${reminderDays}`);
        setUpcomingPayments(response.data);
      } catch (error) {
        console.error('Error fetching upcoming payments:', error);
      }
    };
    fetchUpcomingPayments();
  }, [reminderDays]);

  // Handle Edit Tenant
  const handleEditTenant = (tenant) => {
    setEditingItem(tenant);
    setTenantForm({
      name: tenant.name,
      email: tenant.email,
      phone: tenant.phone,
      password: '' // Don't pre-fill password
    });
    setShowTenantModal(true);
  };

  // Handle Delete Tenant
  const handleDeleteTenant = async (tenantId) => {
    if (window.confirm('Are you sure you want to delete this tenant?')) {
      try {
        await axios.delete(`${API_URL}/admin/tenants/${tenantId}`);
        fetchData();
        alert('Tenant deleted successfully');
      } catch (error) {
        alert('Error deleting tenant: ' + error.response?.data?.message);
      }
    }
  };

  // Create or Update Tenant
  const handleTenantSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing tenant
        const updateData = {
          name: tenantForm.name,
          email: tenantForm.email,
          phone: tenantForm.phone
        };
        
        if (tenantForm.password) {
          updateData.password = tenantForm.password;
        }
        
        await axios.put(`${API_URL}/admin/tenants/${editingItem.id}`, updateData);
        
        // Update local state immediately
        setTenants(tenants.map(tenant => 
          tenant.id === editingItem.id ? {...tenant, ...updateData} : tenant
        ));
        alert('Tenant updated successfully');
      } else {
        // Create new tenant
        const response = await axios.post(`${API_URL}/admin/tenants`, tenantForm);
        
        // Add new tenant to local state immediately
        const newTenant = {
          id: Date.now(), // Temporary ID
          ...tenantForm,
          property_name: 'Not assigned'
        };
        setTenants([...tenants, newTenant]);
        alert('Tenant created successfully');
      }
      
      setShowTenantModal(false);
      setEditingItem(null);
      setTenantForm({ name: '', email: '', phone: '', password: '' });
      
      // Still fetch data to sync with backend if it's working
      fetchData();
    } catch (error) {
      console.error('Tenant operation error:', error);
      alert(`Error ${editingItem ? 'updating' : 'creating'} tenant: ` + (error.response?.data?.message || error.message));
    }
  };

  // Create Property
  const handleCreateProperty = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/admin/properties`, propertyForm);
      
      // Add new property to local state immediately
      const newProperty = {
        id: Date.now(), // Temporary ID
        ...propertyForm,
        rent_amount: parseFloat(propertyForm.rent_amount),
        status: 'available'
      };
      setProperties([...properties, newProperty]);
      
      setShowPropertyModal(false);
      setPropertyForm({ name: '', type: '', rent_amount: '', description: '' });
      alert('Property created successfully');
      
      // Still fetch data to sync with backend if it's working
      fetchData();
    } catch (error) {
      console.error('Property creation error:', error);
      if (error.response?.status === 401) {
        alert('Your session has expired. Please login again.');
      } else {
        alert('Error creating property: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  // Create Payment
  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/admin/payments`, paymentForm);
      
      // Add new payment to local state immediately
      const selectedTenant = tenants.find(t => t.id.toString() === paymentForm.user_id);
      const selectedProperty = properties.find(p => p.id.toString() === paymentForm.property_id);
      
      const newPayment = {
        payment_id: Date.now(),
        tenant_name: selectedTenant?.name || 'Unknown Tenant',
        property_name: selectedProperty?.name || 'Unknown Property',
        amount: parseFloat(paymentForm.amount),
        due_date: paymentForm.due_date,
        payment_status: 'pending',
        status: 'pending',
        email: selectedTenant?.email || ''
      };
      setPayments([...payments, newPayment]);
      
      setShowPaymentModal(false);
      setPaymentForm({ user_id: '', property_id: '', amount: '', due_date: '' });
      alert('Payment created successfully');
      
      fetchData();
    } catch (error) {
      console.error('Payment creation error:', error);
      alert('Error creating payment: ' + (error.response?.data?.message || error.message));
    }
  };

  // Mark Payment as Paid
  const markPaymentPaid = async (paymentId) => {
    try {
      await axios.put(`${API_URL}/admin/payments/${paymentId}/paid`, {
        payment_reference: `PAY-${Date.now()}`
      });
      fetchData();
    } catch (error) {
      alert('Error marking payment as paid');
    }
  };

  // Stats calculation
  const stats = {
    totalTenants: tenants.length,
    totalProperties: properties.length,
    totalPayments: payments.length,
    overduePayments: payments.filter(p => p.payment_status === 'overdue').length,
    totalRevenue: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
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
      month: 'short',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'calendar', name: 'Calendar', icon: Calendar },
    { id: 'maintenance', name: 'Maintenance', icon: Wrench },
    { id: 'tenants', name: 'Tenants', icon: Users },
    { id: 'properties', name: 'Properties', icon: Home },
    { id: 'payments', name: 'Payments', icon: CreditCard }
  ];

  // Add loading indicator to the UI
  if (isLoading) {
    return (
      <Layout title="Admin Dashboard">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  // Add reminder functionality
  const handleSendReminders = async () => {
    try {
      const response = await axios.post(`${API_URL}/admin/send-payment-reminders`, {
        days_ahead: reminderDays
      });
      alert(`Reminders sent: ${response.data.emailsSent} successful, ${response.data.emailsFailed} failed`);
      setShowReminderModal(false);
    } catch (error) {
      alert('Error sending reminders: ' + error.response?.data?.message);
    }
  };

  // Send overdue payment reminders
  const handleSendOverdueReminders = async () => {
    if (!window.confirm('Send payment reminders to all tenants with overdue payments?')) {
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/payments/send-reminders`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        console.log('📧 Email reminder results:', response.data.results);
      } else {
        toast.error('Failed to send reminders');
      }
    } catch (error) {
      console.error('Error sending overdue reminders:', error);
      toast.error('Error sending reminders: ' + (error.response?.data?.message || error.message));
    }
    setIsLoading(false);
  };

  // Add this inside the Overview tab content, after the Overdue Payments section
  const renderReminderSection = () => (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Payment Reminders</h3>
        <button
          onClick={() => setShowReminderModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Bell className="h-4 w-4 mr-2" />
          Send Reminders
        </button>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-3">Upcoming Payments</h4>
        {upcomingPayments.length > 0 ? (
          upcomingPayments.map(payment => (
            <div key={payment.payment_id} className="flex justify-between items-center py-2 border-b border-yellow-200 last:border-b-0">
              <div>
                <p className="text-sm font-medium text-yellow-900">{payment.tenant_name}</p>
                <p className="text-xs text-yellow-700">{payment.property_name} - {formatCurrency(payment.amount)}</p>
              </div>
              <span className="text-xs text-yellow-600">
                Due in {Math.floor(payment.days_until_due)} days
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-yellow-700">No upcoming payments in the next {reminderDays} days</p>
        )}
      </div>
    </div>
  );

  return (
    <Layout title="Admin Dashboard">
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Tenants
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalTenants}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Home className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Properties
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalProperties}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Payments
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalPayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Overdue
                    </dt>
                    <dd className="text-lg font-medium text-red-600">
                      {stats.overduePayments}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Revenue
                    </dt>
                    <dd className="text-lg font-medium text-green-600">
                      {formatCurrency(stats.totalRevenue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
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
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                
                {/* Recent Overdue Payments */}
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-red-800">Overdue Payments</h4>
                    {payments.filter(p => p.payment_status === 'overdue').length > 0 && (
                      <button
                        onClick={handleSendOverdueReminders}
                        disabled={isLoading}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                        ) : (
                          <Mail className="h-3 w-3 mr-1" />
                        )}
                        Send Reminders
                      </button>
                    )}
                  </div>
                  {payments.filter(p => p.payment_status === 'overdue').slice(0, 3).map(payment => (
                    <div key={payment.payment_id} className="flex justify-between items-center py-2 border-b border-red-200 last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-red-900">{payment.tenant_name}</p>
                        <p className="text-xs text-red-700">{payment.property_name} - {formatCurrency(payment.amount)}</p>
                      </div>
                      <span className="text-xs text-red-600">
                        {Math.floor(payment.days_overdue)} days overdue
                      </span>
                    </div>
                  ))}
                  {payments.filter(p => p.payment_status === 'overdue').length === 0 && (
                    <p className="text-sm text-red-600">No overdue payments at this time.</p>
                  )}
                </div>

                {/* Add the reminder section */}
                {renderReminderSection()}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <AdminCalendar userRole="admin" />
              </div>
            )}

            {/* Maintenance Tab */}
            {activeTab === 'maintenance' && (
              <div>
                <MaintenanceRequests userRole="admin" />
              </div>
            )}

            {/* Tenants Tab */}
            {activeTab === 'tenants' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Tenants</h3>
                  <button
                    onClick={() => setShowTenantModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tenant
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.property_name || 'Not assigned'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => handleEditTenant(tenant)}
                              className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteTenant(tenant.id)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center ml-4"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Properties Tab */}
            {activeTab === 'properties' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Properties</h3>
                  <button
                    onClick={() => setShowPropertyModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <div key={property.id} className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-lg font-medium text-gray-900">{property.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{property.type}</p>
                      <p className="text-sm text-gray-500 mt-2">{property.description}</p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-lg font-bold text-green-600">{formatCurrency(property.rent_amount)}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          property.status === 'available' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {property.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Payments</h3>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.payment_id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{payment.tenant_name}</div>
                              <div className="text-sm text-gray-500">{payment.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{payment.property_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(payment.amount)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(payment.due_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              payment.payment_status === 'paid' 
                                ? 'bg-green-100 text-green-800'
                                : payment.payment_status === 'overdue'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.payment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {payment.status === 'pending' && (
                              <button
                                onClick={() => markPaymentPaid(payment.payment_id)}
                                className="text-indigo-600 hover:text-indigo-900 flex items-center"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Paid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {/* Tenant Modal */}
        {showTenantModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingItem ? 'Edit Tenant' : 'Add New Tenant'}
              </h3>
              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({...tenantForm, name: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({...tenantForm, email: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm({...tenantForm, phone: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder={editingItem ? "New Password (leave blank to keep current)" : "Password"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={tenantForm.password}
                  onChange={(e) => setTenantForm({...tenantForm, password: e.target.value})}
                  required={!editingItem}
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowTenantModal(false);
                      setEditingItem(null);
                      setTenantForm({ name: '', email: '', phone: '', password: '' });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    {editingItem ? 'Update Tenant' : 'Create Tenant'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Property Modal */}
        {showPropertyModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Property</h3>
              <form onSubmit={handleCreateProperty} className="space-y-4">
                <input
                  type="text"
                  placeholder="Property Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={propertyForm.name}
                  onChange={(e) => setPropertyForm({...propertyForm, name: e.target.value})}
                  required
                />
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={propertyForm.type}
                  onChange={(e) => setPropertyForm({...propertyForm, type: e.target.value})}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="condo">Condo</option>
                  <option value="studio">Studio</option>
                </select>
                <input
                  type="number"
                  placeholder="Rent Amount (₦)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={propertyForm.rent_amount}
                  onChange={(e) => setPropertyForm({...propertyForm, rent_amount: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="3"
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({...propertyForm, description: e.target.value})}
                ></textarea>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPropertyModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Create Property
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Payment</h3>
              <form onSubmit={handleCreatePayment} className="space-y-4">
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={paymentForm.user_id}
                  onChange={(e) => setPaymentForm({...paymentForm, user_id: e.target.value})}
                  required
                >
                  <option value="">Select Tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </select>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={paymentForm.property_id}
                  onChange={(e) => setPaymentForm({...paymentForm, property_id: e.target.value})}
                  required
                >
                  <option value="">Select Property</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>{property.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Amount (₦)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  required
                />
                <input
                  type="date"
                  placeholder="Due Date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={paymentForm.due_date}
                  onChange={(e) => setPaymentForm({...paymentForm, due_date: e.target.value})}
                  required
                />
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Create Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reminder Modal */}
        {showReminderModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Send Payment Reminders</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Days Ahead</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={reminderDays}
                    onChange={(e) => setReminderDays(parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowReminderModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendReminders}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                  >
                    Send Reminders
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminDashboard;