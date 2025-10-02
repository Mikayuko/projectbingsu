// src/pages/order/track.tsx
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

  // เมื่อเข้าหน้า พร้อม query string
  useEffect(() => {
    if (code) {
      const cleanCode = (code as string).toUpperCase().replace(/^#/, '');
      setCustomerCode('#' + cleanCode);
      trackOrder(cleanCode);
    }
  }, [code]);

  // Auto-refresh ทุก 10 วินาที ถ้า order ยังไม่เสร็จ
  useEffect(() => {
    if (
      order &&
      autoRefresh &&
      order.status !== 'Completed' &&
      order.status !== 'Cancelled'
    ) {
      const interval = setInterval(() => {
        trackOrder(customerCode.replace(/^#/, ''), true); // silent
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [order, autoRefresh, customerCode]);

  const trackOrder = async (trackingCode: string, silent = false) => {
    const cleanCode = trackingCode.trim().toUpperCase().replace(/^#/, '');
    if (!cleanCode) {
      setError('Please enter a customer code');
      return;
    }

    if (!silent) setLoading(true);
    setError('');

    try {
      console.log('🔍 Tracking order with code:', cleanCode);
      const result = await api.trackOrder(cleanCode); // เรียก API
      console.log('✅ Order found:', result);
      setOrder(result.order);
    } catch (err: any) {
      console.error('❌ Track order error:', err);
      if (err.response?.status === 404 || err.message.includes('404')) {
        setError('Order not found. Please check your customer code.');
      } else if (err.response?.status === 500 || err.message.includes('500')) {
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
    if (!customerCode.trim()) {
      setError('Please enter a customer code');
      return;
    }
    const cleanCode = customerCode.trim().toUpperCase().replace(/^#/, '');
    trackOrder(cleanCode);
    router.push(`/order/track?code=${cleanCode}`, undefined, { shallow: true });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      Pending: 'bg-yellow-500',
      Preparing: 'bg-blue-500',
      Ready: 'bg-green-500',
      Completed: 'bg-gray-500',
      Cancelled: 'bg-red-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      Pending: '⏳',
      Preparing: '👨‍🍳',
      Ready: '✅',
      Completed: '🎉',
      Cancelled: '❌',
    };
    return icons[status as keyof typeof icons] || '❓';
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 shadow-lg">
        <Link href="/order">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
            <span className="text-white text-2xl">{'<'}</span>
          </div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Track Order</h1>
      </div>

      {/* Main */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Input Customer Code */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Enter Customer Code</h2>
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
                const val = e.target.value.toUpperCase().replace(/^#/, '');
                setCustomerCode('#' + val);
                setError('');
              }}
              placeholder="#XXXXX"
              className="flex-1 p-3 border-2 border-[#69806C] rounded-lg text-xl font-['Iceland'] uppercase"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              maxLength={7} // # + 5 ตัวอักษร
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

        {/* Order Display */}
        {order && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div
              className={`${getStatusColor(order.status)} text-white rounded-lg p-6 mb-6 text-center`}
            >
              <div className="text-6xl mb-2">{getStatusIcon(order.status)}</div>
              <h3 className="text-3xl font-['Iceland'] mb-2">Order {order.status}</h3>
              <p className="text-lg opacity-90 font-['Iceland']">
                Order ID: {order.orderId || order._id}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
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

        
      </div>
    </div>
  );
}
