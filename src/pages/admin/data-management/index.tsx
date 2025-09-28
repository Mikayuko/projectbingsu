// src/pages/admin/data-management/index.tsx

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, isAdmin } from '@/utils/api';
import { useRouter } from 'next/router';

interface MenuData {
  flavors: Array<{ name: string; price: number; active: boolean }>;
  toppings: Array<{ name: string; price: number; active: boolean }>;
  sizes: Array<{ size: string; price: number }>;
}

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalReviews: number;
  averageRating: number;
  activeCodes: number;
}

export default function DataManagementPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'menu' | 'users' | 'stats'>('menu');
  const [menuData, setMenuData] = useState<MenuData>({
    flavors: [
      { name: 'Strawberry', price: 60, active: true },
      { name: 'Thai Tea', price: 60, active: true },
      { name: 'Matcha', price: 60, active: true },
      { name: 'Milk', price: 60, active: true },
      { name: 'Green Tea', price: 60, active: true },
    ],
    toppings: [
      { name: 'Apple', price: 10, active: true },
      { name: 'Cherry', price: 10, active: true },
      { name: 'Blueberry', price: 10, active: true },
      { name: 'Raspberry', price: 10, active: true },
      { name: 'Strawberry', price: 10, active: true },
      { name: 'Banana', price: 10, active: true },
      { name: 'Mango', price: 10, active: true },
    ],
    sizes: [
      { size: 'S', price: 0 },
      { size: 'M', price: 10 },
      { size: 'L', price: 20 },
    ]
  });
  
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalReviews: 0,
    averageRating: 0,
    activeCodes: 0
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/login');
      return;
    }
    
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'stats') {
        // Fetch statistics
        const orderStats = await api.getOrderStats();
        const reviewStats = await api.getReviews(1, 1); // Just to get stats
        
        setStats({
          totalUsers: 5, // Mock data
          totalOrders: orderStats.todayOrders || 0,
          totalRevenue: orderStats.todayRevenue || 0,
          totalReviews: reviewStats.totalReviews || 0,
          averageRating: reviewStats.stats?.average || 0,
          activeCodes: 10 // Mock data
        });
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMenuPrice = (type: 'flavors' | 'toppings', index: number, newPrice: number) => {
    const updated = { ...menuData };
    updated[type][index].price = newPrice;
    setMenuData(updated);
    // In real app, this would save to backend
  };

  const toggleItemActive = (type: 'flavors' | 'toppings', index: number) => {
    const updated = { ...menuData };
    updated[type][index].active = !updated[type][index].active;
    setMenuData(updated);
  };

  const exportData = (type: string) => {
    const data = type === 'menu' ? menuData : stats;
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `bingsu_${type}_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Data Management</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex mb-8">
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'menu'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            Menu Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'users'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            User Management
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-md font-['Iceland'] text-lg transition ${
              activeTab === 'stats'
                ? 'bg-[#69806C] text-white'
                : 'text-[#69806C] hover:bg-gray-100'
            }`}
          >
            Statistics
          </button>
        </div>

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            {/* Flavors Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl text-[#69806C] font-['Iceland']">Shaved Ice Flavors</h3>
                <button
                  onClick={() => exportData('menu')}
                  className="px-4 py-2 bg-blue-500 text-white rounded font-['Iceland'] hover:bg-blue-600"
                >
                  Export Data
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Flavor</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Base Price</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Status</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuData.flavors.map((flavor, index) => (
                      <tr key={flavor.name} className="border-b">
                        <td className="py-3 font-['Iceland']">{flavor.name}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={flavor.price}
                            onChange={(e) => updateMenuPrice('flavors', index, Number(e.target.value))}
                            className="w-20 p-1 border rounded font-['Iceland']"
                          />
                          <span className="ml-2 font-['Iceland']">฿</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm font-['Iceland'] ${
                            flavor.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {flavor.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => toggleItemActive('flavors', index)}
                            className={`px-3 py-1 rounded text-sm font-['Iceland'] ${
                              flavor.active
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {flavor.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Toppings Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Toppings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Topping</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Price</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Status</th>
                      <th className="text-left py-2 font-['Iceland'] text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuData.toppings.map((topping, index) => (
                      <tr key={topping.name} className="border-b">
                        <td className="py-3 font-['Iceland']">{topping.name}</td>
                        <td className="py-3">
                          <input
                            type="number"
                            value={topping.price}
                            onChange={(e) => updateMenuPrice('toppings', index, Number(e.target.value))}
                            className="w-20 p-1 border rounded font-['Iceland']"
                          />
                          <span className="ml-2 font-['Iceland']">฿</span>
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-sm font-['Iceland'] ${
                            topping.active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {topping.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3">
                          <button
                            onClick={() => toggleItemActive('toppings', index)}
                            className={`px-3 py-1 rounded text-sm font-['Iceland'] ${
                              topping.active
                                ? 'bg-red-500 text-white hover:bg-red-600'
                                : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {topping.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Size Pricing */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Size Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                {menuData.sizes.map((size) => (
                  <div key={size.size} className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-3xl font-['Iceland'] text-[#69806C] mb-2">{size.size}</div>
                    <div className="text-xl font-['Iceland']">+฿{size.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">User Management</h3>
            
            <div className="space-y-4">
              {/* Mock user data */}
              {[
                { id: 1, name: 'Test Customer', email: 'user@bingsu.com', role: 'customer', orders: 5, points: 50 },
                { id: 2, name: 'Alice Johnson', email: 'alice@example.com', role: 'customer', orders: 8, points: 80 },
                { id: 3, name: 'Admin User', email: 'admin@bingsu.com', role: 'admin', orders: 0, points: 0 },
              ].map((user) => (
                <div key={user.id} className="border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-['Iceland'] text-lg font-bold">{user.name}</p>
                    <p className="text-sm text-gray-600 font-['Iceland']">{user.email}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm font-['Iceland']">Orders: {user.orders}</span>
                      <span className="text-sm font-['Iceland']">Points: {user.points}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded text-sm font-['Iceland'] ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                    <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-['Iceland'] hover:bg-gray-300">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Users</h4>
                <p className="text-3xl font-bold text-[#69806C]">{stats.totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Orders Today</h4>
                <p className="text-3xl font-bold text-[#69806C]">{stats.totalOrders}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Today's Revenue</h4>
                <p className="text-3xl font-bold text-[#69806C]">฿{stats.totalRevenue}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Total Reviews</h4>
                <p className="text-3xl font-bold text-[#69806C]">{stats.totalReviews}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Average Rating</h4>
                <p className="text-3xl font-bold text-[#69806C]">{stats.averageRating.toFixed(1)} ⭐</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-gray-600 font-['Iceland'] mb-2">Active Menu Codes</h4>
                <p className="text-3xl font-bold text-[#69806C]">{stats.activeCodes}</p>
              </div>
            </div>

            {/* Export Button */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h4 className="text-xl text-[#69806C] font-['Iceland'] mb-4">Export Reports</h4>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => exportData('stats')}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-['Iceland'] hover:bg-blue-600"
                >
                  Export Statistics
                </button>
                <button
                  onClick={() => alert('Generating PDF report...')}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg font-['Iceland'] hover:bg-green-600"
                >
                  Generate PDF Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}