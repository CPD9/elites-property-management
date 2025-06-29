import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import axios from 'axios';
import Layout from './Layout';

const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, failed
  const [message, setMessage] = useState('Verifying your payment...');
  const [paymentDetails, setPaymentDetails] = useState(null);

  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    
    if (reference || trxref) {
      verifyPayment(reference || trxref);
    } else {
      setStatus('failed');
      setMessage('Invalid payment reference');
    }
  }, [searchParams]);

  const verifyPayment = async (reference) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setStatus('failed');
        setMessage('Authentication required. Please login again.');
        return;
      }

      const response = await axios.post(`${API_URL}/payments/verify/${reference}`, {}, {
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.success) {
        setStatus('success');
        setMessage('Payment verified successfully!');
        setPaymentDetails(response.data);
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/tenant-dashboard');
        }, 3000);
      } else {
        setStatus('failed');
        setMessage(response.data.message || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('failed');
      setMessage(error.response?.data?.message || 'Payment verification failed');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />;
      case 'failed':
        return <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />;
      default:
        return <Clock className="h-16 w-16 text-blue-500 mx-auto animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { 
      style: 'currency', 
      currency: 'NGN' 
    }).format(amount);
  };

  return (
    <Layout title="Payment Status">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className={`rounded-lg border-2 p-8 ${getStatusColor()}`}>
            {getStatusIcon()}
            
            <div className="mt-6 text-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {status === 'success' && 'Payment Successful!'}
                {status === 'failed' && 'Payment Failed'}
                {status === 'processing' && 'Processing Payment...'}
              </h2>
              
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              
              {paymentDetails && (
                <div className="mt-6 bg-white rounded-lg p-4 border">
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Amount:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(paymentDetails.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Reference:</span>
                      <span className="text-sm font-medium font-mono">
                        {paymentDetails.reference}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6 space-y-3">
                {status === 'success' && (
                  <p className="text-xs text-gray-500">
                    Redirecting to dashboard in 3 seconds...
                  </p>
                )}
                
                <button
                  onClick={() => navigate('/tenant-dashboard')}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Return to Dashboard
                </button>
                
                {status === 'failed' && (
                  <button
                    onClick={() => navigate('/tenant-dashboard')}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentCallback;