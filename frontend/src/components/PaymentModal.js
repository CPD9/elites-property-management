import React, { useState, useEffect } from 'react';
import { X, CreditCard, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, overduePayments, onPaymentSuccess, specificPaymentId = null, allPayments = [] }) => {
  const [selectedPayments, setSelectedPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Initialize payments as selected based on specificPaymentId or all overdue
  useEffect(() => {
    if (specificPaymentId) {
      // If specific payment ID is provided, only select that payment
      setSelectedPayments([specificPaymentId]);
    } else if (overduePayments && overduePayments.length > 0) {
      // Otherwise, select all overdue payments
      setSelectedPayments(overduePayments.map(p => p.id));
    }
  }, [overduePayments, specificPaymentId]);

  const togglePaymentSelection = (paymentId) => {
    setSelectedPayments(prev => {
      if (prev.includes(paymentId)) {
        return prev.filter(id => id !== paymentId);
      } else {
        return [...prev, paymentId];
      }
    });
  };

  const getSelectedPaymentsData = () => {
    if (specificPaymentId) {
      // Find the specific payment from either overduePayments or all payments
      let specificPayment = overduePayments.find(p => p.id === specificPaymentId);
      if (!specificPayment && allPayments.length > 0) {
        // Look in all payments if not found in overdue
        const payment = allPayments.find(p => p.payment_id === specificPaymentId);
        if (payment) {
          // Calculate late fee for this payment
          const dueDate = new Date(payment.due_date);
          const isOverdue = dueDate < new Date() && payment.payment_status === 'pending';
          const lateFee = isOverdue ? Math.round(payment.amount * 0.05 * 100) / 100 : 0;
          specificPayment = {
            id: payment.payment_id,
            property_name: payment.property_name,
            amount: payment.amount,
            due_date: payment.due_date,
            late_fee: lateFee,
            total_amount_due: payment.amount + lateFee
          };
        }
      }
      return specificPayment ? [specificPayment] : [];
    }
    return overduePayments.filter(payment => selectedPayments.includes(payment.id));
  };

  const getTotalAmount = () => {
    return getSelectedPaymentsData().reduce((sum, payment) => sum + payment.total_amount_due, 0);
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

  const initializePayment = async () => {
    if (selectedPayments.length === 0) {
      toast.error('Please select at least one payment');
      return;
    }

    setIsLoading(true);
    try {
      // Ensure token is set before making request
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please login again.');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Payment initialization debug:', {
        selectedPayments,
        totalAmount: getTotalAmount(),
        token: token.substring(0, 20) + '...',
        apiUrl: API_URL
      });

      const response = await axios.post(`${API_URL}/payments/initialize`, {
        paymentIds: selectedPayments,
        totalAmount: getTotalAmount()
      }, {
        headers: {
          'x-auth-token': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ Payment initialized successfully:', response.data);
        
        // Redirect directly to Paystack checkout
        if (response.data.authorization_url) {
          setIsLoading(false);
          window.location.href = response.data.authorization_url;
        } else {
          toast.error('Payment URL not received');
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Payment initialization error:', error);
      toast.error('Failed to initialize payment: ' + (error.response?.data?.message || error.message));
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (reference) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/payments/verify/${reference.reference}`, {}, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.success) {
        toast.success('Payment successful!');
        onPaymentSuccess();
        onClose();
      } else {
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      toast.error('Payment verification failed');
    }
    setIsLoading(false);
  };

  const handlePayNowClick = () => {
    initializePayment();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <CreditCard className="h-6 w-6 mr-2 text-indigo-600" />
            Pay Overdue Amounts
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Warning Alert */}
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <span className="font-medium">Late fees applied!</span> A 5% late fee has been added to overdue payments.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Selection */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Select Payments to Pay</h4>
            <div className="space-y-3">
              {overduePayments.map((payment) => (
                <div key={payment.id} className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => togglePaymentSelection(payment.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <div className="ml-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {payment.property_name}
                          </span>
                          <Clock className="h-4 w-4 ml-2 text-red-500" />
                        </div>
                        <p className="text-xs text-gray-500">
                          Due: {formatDate(payment.due_date)} 
                          {payment.late_fee > 0 && (
                            <span className="text-red-600 ml-2">
                              (+ {formatCurrency(payment.late_fee)} late fee)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">
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
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-medium text-indigo-900">Total Amount</h4>
                <p className="text-sm text-indigo-600">
                  {selectedPayments.length} payment{selectedPayments.length !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-indigo-900">
                  {formatCurrency(getTotalAmount())}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Secure Payment with Paystack</h4>
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Bank Cards
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Bank Transfer
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                USSD
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                QR Code
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handlePayNowClick}
              disabled={selectedPayments.length === 0 || isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay {formatCurrency(getTotalAmount())}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;