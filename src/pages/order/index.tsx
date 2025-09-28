// src/pages/order/index.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { api, getCurrentUser, isAuthenticated } from '@/utils/api';

interface Order {
  _id: string;
  orderId: string;
  customerCode: string;
  cupSize: string;
  shavedIce: { flavor: string };
  toppings: Array<{ name: string }>;
  pricing: { total: number };
  status: string;
  createdAt: string;
}

export default function OrderHubPage() {
  const router = useRouter();
  const [trackingCode, setTrackingCode] = useState('');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track');
  const user = getCurrentUser();

  useEffect(() => {
    if (isAuthenticated() && activeTab === 'history') {
      fetchMyOrders();
    }
  }, [activeTab]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const result = await api.getMyOrders();
      setMyOrders(result.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => {
    if (trackingCode) {
      router.push(`/order/track?code=${trackingCode}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Preparing': 'bg-blue-100 text-blue-800',
      'Ready': 'bg-green-100 text-green-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 shadow-lg">
        <Link href="/home">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
            <span className="text-white text-2xl">{'<'}</span>
          </div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Order Center</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-4 text-center">
            🍧 Bingsu Order Management
          </h2>
          <p className="text-center text-gray-600 font-['Iceland'] text-lg">
            Track your order or view your order history
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1 inline-flex">
            <button
              onClick={() => setActiveTab('track')}
              className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
                activeTab === 'track'
                  ? 'bg-[#69806C] text-white'
                  : 'text-[#69806C] hover:bg-gray-100'
              }`}
            >
              Track Order
            </button>
            {isAuthenticated() && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
                  activeTab === 'history'
                    ? 'bg-[#69806C] text-white'
                    : 'text-[#69806C] hover:bg-gray-100'
                }`}
              >
                My Orders
              </button>
            )}
          </div>
        </div>

        {/* Track Order Tab */}
        {activeTab === 'track' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6 text-center">
                Track Your Order
              </h3>
              
              {/* Quick Track Form */}
              <div className="mb-8">
                <label className="block text-gray-700 font-['Iceland'] text-lg mb-2">
                  Enter Customer Code
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="#xxxxx"
                    className="flex-1 p-4 text-xl font-['Iceland'] border-2 border-[#69806C] rounded-lg focus:outline-none focus:border-[#5a6e5e]"
                    onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                  />
                  <button
                    onClick={handleTrack}
                    disabled={!trackingCode}
                    className="px-8 py-4 bg-[#69806C] text-white text-xl font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition disabled:opacity-50"
                  >
                    Track
                  </button>
                </div>
                <p className="text-sm text-gray-500 font-['Iceland'] mt-2">
                  * Customer code starts with # followed by 5 characters
                </p>
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-['Iceland'] text-lg text-yellow-800 mb-2">
                    💡 How to track?
                  </h4>
                  <ol className="text-sm text-yellow-700 font-['Iceland'] space-y-1">
                    <li>1. Get your customer code after ordering</li>
                    <li>2. Enter the code above</li>
                    <li>3. View real-time order status</li>
                  </ol>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-['Iceland'] text-lg text-blue-800 mb-2">
                    📱 Save your code!
                  </h4>
                  <p className="text-sm text-blue-700 font-['Iceland']">
                    Take a photo or write down your customer code to track your order anytime
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8 pt-8 border-t text-center">
                <p className="text-gray-600 font-['Iceland'] mb-4">Don't have an order yet?</p>
                <Link href="/menu">
                  <button className="px-8 py-3 bg-[#947E5A] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#7a6648] transition">
                    Order Now →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Order History Tab */}
        {activeTab === 'history' && isAuthenticated() && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-6">
              My Order History
            </h3>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 font-['Iceland']">Loading orders...</p>
              </div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍧</div>
                <p className="text-gray-500 font-['Iceland'] text-lg mb-4">
                  No orders yet
                </p>
                <Link href="/menu">
                  <button className="px-6 py-3 bg-[#69806C] text-white font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition">
                    Make Your First Order
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => (
                  <div
                    key={order._id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-xl font-['Iceland'] text-[#69806C] font-bold">
                          Order #{order.orderId}
                        </p>
                        <p className="text-sm text-gray-500 font-['Iceland']">
                          {new Date(order.createdAt).toLocaleString('th-TH')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-['Iceland'] font-bold ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Customer Code</p>
                        <p className="font-['Iceland'] text-[#543429] font-bold">{order.customerCode}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Size</p>
                        <p className="font-['Iceland'] text-[#543429]">{order.cupSize}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Flavor</p>
                        <p className="font-['Iceland'] text-[#543429]">{order.shavedIce.flavor}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-['Iceland']">Total</p>
                        <p className="font-['Iceland'] text-[#543429] font-bold">฿{order.pricing.total}</p>
                      </div>
                    </div>

                    {order.toppings.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-['Iceland'] mb-1">Toppings</p>
                        <p className="font-['Iceland'] text-sm text-[#543429]">
                          {order.toppings.map(t => t.name).join(', ')}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/order/track?code=${order.customerCode}`}>
                        <button className="px-4 py-2 bg-[#69806C] text-white font-['Iceland'] text-sm rounded hover:bg-[#5a6e5e] transition">
                          Track Order
                        </button>
                      </Link>
                      {order.status === 'Completed' && (
                        <Link href={`/review?orderId=${order._id}`}>
                          <button className="px-4 py-2 border border-[#69806C] text-[#69806C] font-['Iceland'] text-sm rounded hover:bg-[#69806C] hover:text-white transition">
                            Write Review
                          </button>
                        </Link>
                      )}
                      <Link href="/menu">
                        <button className="px-4 py-2 border border-gray-300 text-gray-600 font-['Iceland'] text-sm rounded hover:bg-gray-100 transition">
                          Order Again
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loyalty Points Summary (if logged in) */}
            {user && (
              <div className="mt-8 p-6 bg-gradient-to-r from-[#69806C] to-[#947E5A] rounded-lg text-white">
                <h4 className="text-xl font-['Iceland'] mb-2">Your Rewards</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm opacity-80">Loyalty Points</p>
                    <p className="text-2xl font-bold font-['Iceland']">{user.loyaltyPoints || 0} pts</p>
                  </div>
                  <div>
                    <p className="text-sm opacity-80">Stamps Collected</p>
                    <p className="text-2xl font-bold font-['Iceland']">{user.loyaltyCard?.stamps || 0}/9</p>
                  </div>
                </div>
                {user.loyaltyCard?.stamps >= 7 && (
                  <p className="mt-3 text-sm font-['Iceland'] bg-white/20 rounded p-2">
                    🎉 Only {9 - user.loyaltyCard.stamps} more stamps until your free drink!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Not Logged In Message for History Tab */}
        {activeTab === 'history' && !isAuthenticated() && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">
              Login to View Order History
            </h3>
            <p className="text-gray-600 font-['Iceland'] mb-6">
              Sign in to access your order history and loyalty rewards
            </p>
            <Link href="/login">
              <button className="px-8 py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition">
                Login Now
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}