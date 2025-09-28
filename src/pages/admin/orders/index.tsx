// src/pages/admin/orders/index.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface Order {
  _id?: string;
  orderId: string;
  customerCode: string;
  menuCode: string;
  cupSize: string;
  shavedIce: { flavor: string; points: number };
  toppings: Array<{ name: string; points: number }>;
  pricing: { total: number };
  status: string;
  createdAt: string;
  specialInstructions?: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    popularFlavor: ''
  });

  useEffect(() => {
    fetchOrders();
    calculateStats();
  }, [filter]);

  const fetchOrders = () => {
    setLoading(true);
    try {
      // Get orders from localStorage
      const storedOrders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      
      // Add orderId if missing
      const ordersWithId = storedOrders.map((order: Order, index: number) => ({
        ...order,
        orderId: order.orderId || `ORD${(index + 1).toString().padStart(5, '0')}`
      }));

      // Filter orders
      let filteredOrders = ordersWithId;
      if (filter !== 'all') {
        filteredOrders = ordersWithId.filter((order: Order) => order.status === filter);
      }

      // Sort by date (newest first)
      filteredOrders.sort((a: Order, b: Order) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setOrders(filteredOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const storedOrders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's orders
    const todayOrders = storedOrders.filter((order: Order) => {
      const orderDate = new Date(order.createdAt);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    });

    // Calculate revenue
    const todayRevenue = todayOrders.reduce((sum: number, order: Order) => 
      sum + (order.pricing?.total || 0), 0
    );

    // Pending orders
    const pendingOrders = storedOrders.filter((order: Order) => 
      order.status === 'Pending'
    ).length;

    // Popular flavor
    const flavorCount: { [key: string]: number } = {};
    storedOrders.forEach((order: Order) => {
      const flavor = order.shavedIce?.flavor;
      if (flavor) {
        flavorCount[flavor] = (flavorCount[flavor] || 0) + 1;
      }
    });
    const popularFlavor = Object.keys(flavorCount).reduce((a, b) => 
      flavorCount[a] > flavorCount[b] ? a : b, ''
    );

    setStats({
      todayOrders: todayOrders.length,
      todayRevenue,
      pendingOrders,
      popularFlavor
    });
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    // Update in state
    const updatedOrders = orders.map(order => 
      order.orderId === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);

    // Update in localStorage
    const allOrders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
    const updatedAllOrders = allOrders.map((order: Order) => 
      order.orderId === orderId || order.customerCode === orders.find(o => o.orderId === orderId)?.customerCode
        ? { ...order, status: newStatus } 
        : order
    );
    localStorage.setItem('bingsuOrders', JSON.stringify(updatedAllOrders));

    // Recalculate stats
    calculateStats();
    
    // Show success message
    alert(`Order ${orderId} status updated to ${newStatus}`);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'Pending': 'text-yellow-600 bg-yellow-50',
      'Preparing': 'text-blue-600 bg-blue-50',
      'Ready': 'text-green-600 bg-green-50',
      'Completed': 'text-gray-600 bg-gray-50',
      'Cancelled': 'text-red-600 bg-red-50'
    };
    return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'Pending': 'Preparing',
      'Preparing': 'Ready',
      'Ready': 'Completed'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  // Generate sample orders for demo
  const generateSampleOrders = () => {
    const sampleOrders: Order[] = [
      {
        orderId: `ORD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
        customerCode: `#${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        menuCode: 'DEMO1',
        cupSize: 'M',
        shavedIce: { flavor: 'Matcha', points: 3 },
        toppings: [
          { name: 'Strawberry', points: 5 },
          { name: 'Blueberry', points: 3 }
        ],
        pricing: { total: 90 },
        status: 'Pending',
        createdAt: new Date().toISOString(),
        specialInstructions: 'Less ice please'
      },
      {
        orderId: `ORD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
        customerCode: `#${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        menuCode: 'TEST2',
        cupSize: 'L',
        shavedIce: { flavor: 'Thai Tea', points: 2 },
        toppings: [
          { name: 'Mango', points: 4 }
        ],
        pricing: { total: 100 },
        status: 'Preparing',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
      },
      {
        orderId: `ORD${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
        customerCode: `#${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        menuCode: 'TEST3',
        cupSize: 'S',
        shavedIce: { flavor: 'Strawberry', points: 1 },
        toppings: [],
        pricing: { total: 60 },
        status: 'Ready',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago
      }
    ];

    const existingOrders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
    const allOrders = [...existingOrders, ...sampleOrders];
    localStorage.setItem('bingsuOrders', JSON.stringify(allOrders));
    fetchOrders();
    calculateStats();
    alert('Sample orders added successfully!');
  };

  const clearAllOrders = () => {
    if (confirm('Are you sure you want to clear all orders? This cannot be undone.')) {
      localStorage.setItem('bingsuOrders', '[]');
      setOrders([]);
      calculateStats();
      alert('All orders cleared');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EBE6DE] flex items-center justify-center">
        <p className="text-2xl text-[#69806C] font-['Iceland']">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EBE6DE] font-['Iceland']">
      {/* Header */}
      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl">Order Management</h1>
        
        {/* Demo Controls */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={generateSampleOrders}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Add Sample Orders
          </button>
          <button
            onClick={clearAllOrders}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Today's Orders</p>
          <p className="text-3xl font-bold text-[#69806C]">{stats.todayOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Today's Revenue</p>
          <p className="text-3xl font-bold text-[#69806C]">฿{stats.todayRevenue}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Pending Orders</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Popular Flavor</p>
          <p className="text-2xl font-bold text-[#69806C]">
            {stats.popularFlavor || 'N/A'}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex gap-2 mb-6">
          {['all', 'Pending', 'Preparing', 'Ready', 'Completed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-['Iceland'] text-lg transition ${
                filter === status
                  ? 'bg-[#69806C] text-white'
                  : 'bg-white text-[#69806C] hover:bg-gray-100'
              }`}
            >
              {status === 'all' ? 'All Orders' : status}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-xl mb-4">No orders found</p>
            <button
              onClick={generateSampleOrders}
              className="px-6 py-3 bg-[#69806C] text-white rounded-lg hover:bg-[#5a6e5e] transition"
            >
              Generate Sample Orders
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <div
                key={order.orderId || order.customerCode}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                {/* Order Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-2xl font-bold text-[#69806C]">
                      Order #{order.orderId}
                    </p>
                    <p className="text-gray-600">
                      Customer: {order.customerCode}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                {/* Order Details */}
                <div className="border-t border-b py-3 mb-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Size:</span>
                      <span className="ml-2 font-bold">{order.cupSize}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Flavor:</span>
                      <span className="ml-2 font-bold">{order.shavedIce?.flavor}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Toppings:</span>
                      <span className="ml-2 font-bold">
                        {order.toppings?.length > 0 
                          ? order.toppings.map(t => t.name).join(', ')
                          : 'None'}
                      </span>
                    </div>
                  </div>
                  {order.specialInstructions && (
                    <div className="mt-2">
                      <span className="text-gray-600 text-sm">Note:</span>
                      <span className="ml-2 text-sm italic">{order.specialInstructions}</span>
                    </div>
                  )}
                </div>

                {/* Price and Time */}
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-2xl font-bold text-[#69806C]">
                      ฿{order.pricing?.total || 0}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                    <>
                      {getNextStatus(order.status) && (
                        <button
                          onClick={() => updateOrderStatus(order.orderId, getNextStatus(order.status)!)}
                          className="flex-1 px-4 py-2 bg-[#69806C] text-white rounded-lg hover:bg-[#5a6e5e] transition"
                        >
                          Mark as {getNextStatus(order.status)}
                        </button>
                      )}
                      <button
                        onClick={() => updateOrderStatus(order.orderId, 'Cancelled')}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                  {order.status === 'Completed' && (
                    <span className="flex-1 text-center py-2 text-gray-500">
                      Order Completed
                    </span>
                  )}
                  {order.status === 'Cancelled' && (
                    <span className="flex-1 text-center py-2 text-red-500">
                      Order Cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}