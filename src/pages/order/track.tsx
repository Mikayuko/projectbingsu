// src/pages/order/track.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

interface OrderData {
  _id?: string;
  orderId?: string;
  customerCode: string;
  menuCode: string;
  cupSize: string;
  shavedIce: {
    flavor: string;
    points: number;
  };
  toppings: Array<{
    name: string;
    points: number;
  }>;
  pricing: {
    basePrice?: number;
    total: number;
  };
  status: string;
  specialInstructions?: string;
  createdAt: string;
  timestamps?: {
    ordered?: string;
    preparing?: string;
    ready?: string;
    completed?: string;
  };
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const { code } = router.query;
  const [customerCode, setCustomerCode] = useState('');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [recentOrders, setRecentOrders] = useState<OrderData[]>([]);

  useEffect(() => {
    if (code) {
      setCustomerCode(code as string);
      trackOrder(code as string);
    }
  }, [code]);

  // Load recent orders on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      setRecentOrders(orders.slice(-3));
    }
  }, [order]); // Update when order changes

  // Auto-update order status
  useEffect(() => {
    if (order && autoRefresh && order.status !== 'Completed' && order.status !== 'Cancelled') {
      const interval = setInterval(() => {
        // Simulate status progression
        updateOrderStatus();
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [order, autoRefresh]);

  const updateOrderStatus = () => {
    if (!order || typeof window === 'undefined') return;
    
    const statusFlow = ['Pending', 'Preparing', 'Ready', 'Completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    
    if (currentIndex < statusFlow.length - 1) {
      const newStatus = statusFlow[currentIndex + 1];
      const updatedOrder = { ...order, status: newStatus };
      
      // Update in localStorage
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      const orderIndex = orders.findIndex((o: OrderData) => o.customerCode === order.customerCode);
      if (orderIndex !== -1) {
        orders[orderIndex] = updatedOrder;
        localStorage.setItem('bingsuOrders', JSON.stringify(orders));
      }
      
      setOrder(updatedOrder);
    }
  };

  const trackOrder = async (trackingCode: string) => {
    if (!trackingCode) {
      setError('Please enter a customer code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if we're on client side
      if (typeof window !== 'undefined') {
        // First try to find in localStorage
        const localOrders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
        const localOrder = localOrders.find((o: OrderData) => 
          o.customerCode.toLowerCase() === trackingCode.toLowerCase()
        );
        
        if (localOrder) {
          // Add orderId if not present
          if (!localOrder.orderId) {
            localOrder.orderId = `ORD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;
          }
          setOrder(localOrder);
          setError('');
          setLoading(false);
          return;
        }
      }

      // Try API if available
      try {
        const response = await fetch(`http://localhost:5000/api/orders/track/${trackingCode}`);
        if (response.ok) {
          const result = await response.json();
          setOrder(result.order);
          setError('');
        } else {
          throw new Error('Order not found in database');
        }
      } catch (apiError) {
        // If API fails, show not found
        setError('Order not found. Please check your customer code.');
        setOrder(null);
      }
    } catch (err: any) {
      setError('Order not found. Please check your customer code.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = () => {
    if (customerCode) {
      trackOrder(customerCode);
      // Update URL with code
      router.push(`/order/track?code=${customerCode}`, undefined, { shallow: true });
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

  const getTimelineSteps = () => {
    return ['Pending', 'Preparing', 'Ready', 'Completed'];
  };

  const getStepTime = (step: string): string | null => {
    if (!order) return null;
    
    // For demo, show current time for active status
    if (step === order.status) {
      return new Date().toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      });
    }
    
    // Show order creation time for Pending
    if (step === 'Pending' && order.createdAt) {
      return new Date(order.createdAt).toLocaleString('th-TH', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: 'short'
      });
    }
    
    return null;
  };

  // Demo function to manually update status
  const manualUpdateStatus = () => {
    if (!order || typeof window === 'undefined') return;
    
    const statusFlow = ['Pending', 'Preparing', 'Ready', 'Completed'];
    const currentIndex = statusFlow.indexOf(order.status);
    
    if (currentIndex < statusFlow.length - 1) {
      const newStatus = statusFlow[currentIndex + 1];
      const updatedOrder = { ...order, status: newStatus };
      
      // Update in localStorage
      const orders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      const orderIndex = orders.findIndex((o: OrderData) => o.customerCode === order.customerCode);
      if (orderIndex !== -1) {
        orders[orderIndex] = updatedOrder;
        localStorage.setItem('bingsuOrders', JSON.stringify(orders));
      }
      
      setOrder(updatedOrder);
      alert(`Order status updated to: ${newStatus}`);
    }
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
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Track Your Order</h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Enter Customer Code</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              placeholder="#xxxxx"
              className="flex-1 p-3 border-2 border-[#69806C] rounded-lg text-xl font-['Iceland'] focus:outline-none focus:border-[#5a6e5e]"
              disabled={loading}
              onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
            />
            <button
              onClick={handleTrack}
              disabled={loading || !customerCode}
              className="px-6 py-3 bg-[#69806C] text-white text-xl font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Tracking...' : 'Track'}
            </button>
          </div>
          {error && (
            <div className="mt-3">
              <p className="text-red-500 font-['Iceland']">{error}</p>
              <p className="text-sm text-gray-500 font-['Iceland'] mt-2">
                Tip: Customer codes start with # (e.g., #ABC12)
              </p>
            </div>
          )}
        </div>

        {/* Show Recent Orders (Demo Helper) */}
        {!order && !loading && recentOrders.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800 font-['Iceland'] text-lg mb-2">
              💡  Tip: Recent orders from this browser
            </p>
            <div className="text-sm text-blue-700 font-['Iceland']">
              <p>Your recent customer codes:</p>
              {recentOrders.map((o: OrderData, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    setCustomerCode(o.customerCode);
                    trackOrder(o.customerCode);
                  }}
                  className="block mt-1 text-blue-600 underline hover:text-blue-800"
                >
                  {o.customerCode} - {o.shavedIce.flavor} ({o.status})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No orders message */}
        {!order && !loading && recentOrders.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-800 font-['Iceland'] text-lg">
              💡  No recent orders. Create a new order from the home page!
            </p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Status Banner */}
            <div className={`${getStatusColor(order.status)} text-white rounded-lg p-6 mb-6 text-center`}>
              <div className="text-6xl mb-2">{getStatusIcon(order.status)}</div>
              <h3 className="text-3xl font-['Iceland'] mb-2">Order {order.status}</h3>
              <p className="text-lg opacity-90 font-['Iceland']">
                Order ID: {order.orderId || `ORD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`}
              </p>
            </div>

            {/* Demo Controls */}
            {order.status !== 'Completed' && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-[#69806C] font-['Iceland']">
                      Auto-update status (every 10 seconds)
                    </span>
                  </label>
                  <button
                    onClick={manualUpdateStatus}
                    className="px-4 py-2 bg-[#69806C] text-white rounded font-['Iceland'] hover:bg-[#5a6e5e] transition"
                  >
                    Update Status
                  </button>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="mb-6">
              <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Order Progress</h4>
              <div className="relative pl-8">
                <div className="absolute left-0 top-0 h-full w-0.5 bg-gray-300"></div>
                
                {getTimelineSteps().map((step, index) => {
                  const currentIndex = getTimelineSteps().indexOf(order.status);
                  const isActive = currentIndex >= index;
                  const isCancelled = order.status === 'Cancelled';
                  const stepTime = getStepTime(step);
                  
                  return (
                    <div key={step} className="relative mb-6">
                      <div 
                        className={`absolute -left-8 w-4 h-4 rounded-full ${
                          isCancelled ? 'bg-red-500' : 
                          isActive ? 'bg-[#69806C]' : 'bg-gray-300'
                        }`}
                      ></div>
                      <div className={`${
                        isCancelled ? 'text-red-500' :
                        isActive ? 'text-[#69806C]' : 'text-gray-400'
                      }`}>
                        <p className="font-['Iceland'] text-lg font-bold">{step}</p>
                        {stepTime && (
                          <p className="text-sm font-['Iceland']">{stepTime}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Details Grid */}
            <div className="border-t pt-6">
              <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Order Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
                <div>
                  <p className="text-gray-600 font-['Iceland']">Customer Code:</p>
                  <p className="font-['Iceland'] text-xl text-[#543429] font-bold">{order.customerCode}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-['Iceland']">Cup Size:</p>
                  <p className="font-['Iceland'] text-xl text-[#543429] font-bold">{order.cupSize}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-['Iceland']">Shaved Ice Flavor:</p>
                  <p className="font-['Iceland'] text-xl text-[#543429] font-bold">{order.shavedIce.flavor}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-['Iceland']">Toppings:</p>
                  <p className="font-['Iceland'] text-xl text-[#543429] font-bold">
                    {order.toppings.length > 0 
                      ? order.toppings.map((t: any) => t.name).join(', ')
                      : 'None'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 font-['Iceland']">Total Price:</p>
                  <p className="font-['Iceland'] text-2xl text-[#543429] font-bold">฿{order.pricing.total}</p>
                </div>
                <div>
                  <p className="text-gray-600 font-['Iceland']">Ordered At:</p>
                  <p className="font-['Iceland'] text-xl text-[#543429]">
                    {new Date(order.createdAt).toLocaleString('th-TH')}
                  </p>
                </div>
              </div>
              
              {order.specialInstructions && (
                <div className="mt-4">
                  <p className="text-gray-600 font-['Iceland']">Special Instructions:</p>
                  <p className="font-['Iceland'] text-lg text-[#543429] bg-gray-50 p-3 rounded-lg mt-1">
                    {order.specialInstructions}
                  </p>
                </div>
              )}
            </div>

            {/* Status Messages */}
            {order.status === 'Pending' && (
              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-yellow-800 font-['Iceland'] text-lg">
                  ⏱️ Estimated preparation time: 10-15 minutes
                </p>
                <p className="text-yellow-700 font-['Iceland'] text-sm mt-1">
                  We're reviewing your order and will start preparing it soon!
                </p>
              </div>
            )}
            
            {order.status === 'Preparing' && (
              <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-blue-800 font-['Iceland'] text-lg">
                  👨‍🍳 Your Bingsu is being crafted with care!
                </p>
                <p className="text-blue-700 font-['Iceland'] text-sm mt-1">
                  Our chef is preparing your delicious shaved ice treat.
                </p>
              </div>
            )}
            
            {order.status === 'Ready' && (
              <div className="mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg animate-pulse">
                <p className="text-green-800 font-['Iceland'] text-xl font-bold">
                  🎉 Your order is ready for pickup!
                </p>
                <p className="text-green-700 font-['Iceland'] text-sm mt-1">
                  Please come to the counter with your customer code: {order.customerCode}
                </p>
              </div>
            )}

            {order.status === 'Completed' && (
              <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <p className="text-gray-800 font-['Iceland'] text-lg">
                  ✨ Thank you for your order!
                </p>
                <p className="text-gray-600 font-['Iceland'] text-sm mt-1">
                  We hope you enjoyed your Bingsu. See you again soon!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/home">
            <button className="px-6 py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition shadow-lg">
              Order New Bingsu
            </button>
          </Link>
          {order && order.status === 'Completed' && (
            <Link href={`/review`}>
              <button className="px-6 py-3 bg-white border-2 border-[#69806C] text-[#69806C] font-['Iceland'] text-lg rounded-lg hover:bg-[#69806C] hover:text-white transition shadow-lg">
                Leave a Review
              </button>
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center text-gray-500 font-['Iceland']">
          <p>Need help? Contact our staff at the counter</p>
          <p className="text-sm mt-2">Customer codes start with # followed by 5 characters</p>
        </div>
      </div>
    </div>
  );
}