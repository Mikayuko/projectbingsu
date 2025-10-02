// src/pages/order/track.tsx - Fixed API endpoint

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { api } from '@/utils/api';

interface OrderData {
  _id?: string;
  orderId?: string;
  customerCode: string;
  cupSize: string;
  shavedIce: { flavor: string };
  toppings: Array<{ name: string }>;
  pricing: { total: number };
  status: string;
  specialInstructions?: string;
  createdAt: string;
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { code } = router.query;
  const [customerCode, setCustomerCode] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (code) {
      setCustomerCode(code as string);
      trackOrder(code as string);
    }
  }, [code]);

  useEffect(() => {
    if (order && autoRefresh && order.status !== 'Completed' && order.status !== 'Cancelled') {
      const interval = setInterval(() => {
        trackOrder(customerCode, true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [order, autoRefresh, customerCode]);

  const trackOrder = async (trackingCode: string, silent = false) => {
    // ✅ Validate input
    if (!trackingCode || trackingCode.trim() === '') {
      setError('Please enter a customer code');
      return;
    }

    // ✅ Clean the tracking code (remove spaces, convert to uppercase)
    const cleanCode = trackingCode.trim().toUpperCase();

    if (!silent) setLoading(true);
    setError('');

    try {
      console.log('🔍 Tracking order with code:', cleanCode);
      
      const result = await api.trackOrder(cleanCode);
      
      console.log('✅ Order found:', result);
      setOrder(result.order);
      
    } catch (err: any) {
      console.error('❌ Track order error:', err);
      
      // ✅ Better error messages
      if (err.message.includes('404')) {
        setError('Order not found. Please check your customer code.');
      } else if (err.message.includes('500')) {
        setError('Server error. Please try again later.');
      } else {
        setError(err.message || 'Failed to track order');
      }
      
      setOrder(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleTrack = () => {
    if (customerCode && customerCode.trim()) {
      const cleanCode = customerCode.trim().toUpperCase();
      trackOrder(cleanCode);
      router.push(`/order/track?code=${cleanCode}`, undefined, { shallow: true });
    } else {
      setError('Please enter a customer code');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'bg-yellow-500',
      'Preparing': 'bg-blue-500',
      'Ready': 'bg-green-500',
      'Completed': 'bg-gray-500',
      'Cancelled': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      'Pending': '⏳',
      'Preparing': '👨‍🍳',
      'Ready': '✅',
      'Completed': '🎉',
      'Cancelled': '❌'
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 shadow-lg">
        <Link href="/order">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
            <span className="text-white text-2xl">{'<'}</span>
          </div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Track Order</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Enter Customer Code</h2>
          
          {/* Info Box */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-['Iceland']">
              💡 Your customer code should look like: <strong>#ABC12</strong>
            </p>
          </div>

          <div className="flex gap-4">
            <input
              type="text"
              value={customerCode}
              onChange={(e) => {
                setCustomerCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="#XXXXX"
              className="flex-1 p-3 border-2 border-[#69806C] rounded-lg text-xl font-['Iceland'] uppercase"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              maxLength={6}
            />
            <button
              onClick={handleTrack}
              disabled={loading || !customerCode.trim()}
              className="px-6 py-3 bg-[#69806C] text-white text-xl rounded-lg font-['Iceland'] hover:bg-[#5a6e5e] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
          
          {error && (
            <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
              {error}
            </div>
          )}
        </div>

        {order && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className={`${getStatusColor(order.status)} text-white rounded-lg p-6 mb-6 text-center`}>
              <div className="text-6xl mb-2">{getStatusIcon(order.status)}</div>
              <h3 className="text-3xl font-['Iceland'] mb-2">Order {order.status}</h3>
              <p className="text-lg opacity-90 font-['Iceland']">
                Order ID: {order.orderId || order._id}
              </p>
            </div>

            {order.status !== 'Completed' && order.status !== 'Cancelled' && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-[#69806C] font-['Iceland']">
                      Auto-update (every 10s)
                    </span>
                  </label>
                  <button
                    onClick={() => trackOrder(customerCode)}
                    className="px-4 py-2 bg-[#69806C] text-white rounded hover:bg-[#5a6e5e] font-['Iceland'] transition"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            )}

            <div className="mb-6">
              <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Order Progress</h4>
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-300"></div>
                
                {['Pending', 'Preparing', 'Ready', 'Completed'].map((step, index) => {
                  const steps = ['Pending', 'Preparing', 'Ready', 'Completed'];
                  const currentIndex = steps.indexOf(order.status);
                  const isActive = currentIndex >= index;
                  
                  return (
                    <div key={step} className="relative mb-6">
                      <div className={`absolute -left-8 w-4 h-4 rounded-full ${
                        isActive ? 'bg-[#69806C]' : 'bg-gray-300'
                      }`}></div>
                      <p className={`font-['Iceland'] text-lg font-bold ${
                        isActive ? 'text-[#69806C]' : 'text-gray-400'
                      }`}>{step}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-6">
              <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Order Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg font-['Iceland']">
                <div>
                  <p className="text-gray-600">Customer Code:</p>
                  <p className="font-bold text-[#543429]">{order.customerCode}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cup Size:</p>
                  <p className="font-bold text-[#543429]">{order.cupSize}</p>
                </div>
                <div>
                  <p className="text-gray-600">Flavor:</p>
                  <p className="font-bold text-[#543429]">{order.shavedIce.flavor}</p>
                </div>
                <div>
                  <p className="text-gray-600">Toppings:</p>
                  <p className="font-bold text-[#543429]">
                    {order.toppings.length > 0 
                      ? order.toppings.map(t => t.name).join(', ')
                      : 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Price:</p>
                  <p className="text-2xl font-bold text-[#543429]">฿{order.pricing.total}</p>
                </div>
                <div>
                  <p className="text-gray-600">Ordered At:</p>
                  <p className="text-[#543429]">
                    {new Date(order.createdAt).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
              
              {order.specialInstructions && (
                <div className="mt-4">
                  <p className="text-gray-600">Special Instructions:</p>
                  <p className="bg-gray-50 p-3 rounded-lg mt-1 font-['Iceland']">
                    {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>

            {order.status === 'Ready' && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg animate-pulse">
                <p className="text-green-800 font-['Iceland'] text-xl font-bold">
                  🎉 Your order is ready for pickup!
                </p>
                <p className="text-green-700 text-sm mt-1 font-['Iceland']">
                  Please come to the counter with code: <strong>{order.customerCode}</strong>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/home">
            <button className="px-6 py-3 bg-[#69806C] text-white text-lg rounded-lg font-['Iceland'] hover:bg-[#5a6e5e] transition">
              Order New Bingsu
            </button>
          </Link>
          {order && order.status === 'Completed' && (
            <Link href="/review">
              <button className="px-6 py-3 border-2 border-[#69806C] text-[#69806C] text-lg rounded-lg font-['Iceland'] hover:bg-[#69806C] hover:text-white transition">
                Leave Review
              </button>
            </Link>
          )}
        </div>

        {/* Debug Info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <p className="text-xs text-gray-600 font-mono">
              Debug: API Base = {process.env.NEXT_PUBLIC_API_URL || 'localhost:5000'}
            </p>
            <p className="text-xs text-gray-600 font-mono">
              Track Endpoint: /api/orders/track/{customerCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}