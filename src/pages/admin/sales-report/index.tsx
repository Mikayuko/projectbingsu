// src/pages/admin/sales-report/index.tsx - Enhanced with Multiple Top Items & Peak Times

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, isAdmin } from '@/utils/api';
import { useRouter } from 'next/router';

interface Order {
  orderId: string;
  customerCode: string;
  cupSize: string;
  shavedIce: { flavor: string };
  toppings: Array<{ name: string }>;
  pricing: { total: number };
  status: string;
  createdAt: string;
}

interface SalesData {
  date: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

interface TopItem {
  name: string;
  count: number;
}

interface PeakTime {
  timeRange: string;
  count: number;
}

export default function EnhancedSalesReportPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    topFlavors: [] as TopItem[],
    topToppings: [] as TopItem[],
    peakTimes: [] as PeakTime[],
    topCombinations: [] as { combo: string; count: number }[],
    completionRate: 0
  });

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await api.getAllOrders();
      const allOrders = result.orders || [];
      setOrders(allOrders);
      calculateEnhancedSalesData(allOrders);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
      calculateEnhancedSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateEnhancedSalesData = (allOrders: Order[]) => {
    const now = new Date();
    const filteredOrders = allOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      switch (period) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return orderDate >= monthAgo;
        default:
          return true;
      }
    });

    // Group by date
    const groupedData: { [key: string]: Order[] } = {};
    filteredOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString('th-TH');
      if (!groupedData[date]) groupedData[date] = [];
      groupedData[date].push(order);
    });

    // Calculate daily sales
    const dailySales: SalesData[] = Object.entries(groupedData).map(([date, orders]) => ({
      date,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0),
      avgOrderValue: orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0) / orders.length
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setSalesData(dailySales);

    // Calculate totals
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

    // ✅ Top Flavors - Show ALL items with highest count
    const flavorCount: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const flavor = order.shavedIce?.flavor || 'Unknown';
      flavorCount[flavor] = (flavorCount[flavor] || 0) + 1;
    });
    
    const maxFlavorCount = Math.max(...Object.values(flavorCount), 0);
    const topFlavors = Object.entries(flavorCount)
      .filter(([_, count]) => count === maxFlavorCount && maxFlavorCount > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ✅ Top Toppings - Show ALL items with highest count
    const toppingCount: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      order.toppings?.forEach(topping => {
        toppingCount[topping.name] = (toppingCount[topping.name] || 0) + 1;
      });
    });
    
    const maxToppingCount = Math.max(...Object.values(toppingCount), 0);
    const topToppings = Object.entries(toppingCount)
      .filter(([_, count]) => count === maxToppingCount && maxToppingCount > 0)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // ✅ Peak Times - Show ALL time ranges with highest count
    const hourCount: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const timeRange = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      hourCount[timeRange] = (hourCount[timeRange] || 0) + 1;
    });
    
    const maxHourCount = Math.max(...Object.values(hourCount), 0);
    const peakTimes = Object.entries(hourCount)
      .filter(([_, count]) => count === maxHourCount && maxHourCount > 0)
      .map(([timeRange, count]) => ({ timeRange, count }))
      .sort((a, b) => b.count - a.count);

    // Top Combinations
    const comboCount: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      const toppings = order.toppings?.map(t => t.name).sort().join(', ') || 'No toppings';
      const combo = `${order.shavedIce?.flavor} + ${toppings}`;
      comboCount[combo] = (comboCount[combo] || 0) + 1;
    });
    
    const topCombinations = Object.entries(comboCount)
      .map(([combo, count]) => ({ combo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Completion rate
    const completedOrders = filteredOrders.filter(order => order.status === 'Completed').length;
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    setSummary({
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topFlavors,
      topToppings,
      peakTimes,
      topCombinations,
      completionRate
    });
  };

  const exportToCSV = () => {
    let csv = 'Date,Orders,Revenue,Avg Order Value\n';
    salesData.forEach(data => {
      csv += `${data.date},${data.orders},${data.revenue},${data.avgOrderValue.toFixed(2)}\n`;
    });
    
    csv += '\n\nSummary\n';
    csv += `Period,${period}\n`;
    csv += `Total Orders,${summary.totalOrders}\n`;
    csv += `Total Revenue,${summary.totalRevenue}\n`;
    csv += `Avg Order Value,${summary.avgOrderValue.toFixed(2)}\n`;
    csv += `Completion Rate,${summary.completionRate.toFixed(1)}%\n\n`;
    
    csv += 'Top Flavors\n';
    summary.topFlavors.forEach((f, i) => {
      csv += `${i + 1}. ${f.name},${f.count}\n`;
    });
    
    csv += '\nTop Toppings\n';
    summary.topToppings.forEach((t, i) => {
      csv += `${i + 1}. ${t.name},${t.count}\n`;
    });
    
    csv += '\nPeak Times\n';
    summary.peakTimes.forEach((p, i) => {
      csv += `${i + 1}. ${p.timeRange},${p.count}\n`;
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    const exportFileDefaultName = `enhanced_sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE] font-['Iceland']">
      {/* Header */}
      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl">Enhanced Sales Report</h1>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Period Selector */}
        <div className="bg-white rounded-lg shadow-md p-1 inline-flex mb-8">
          <div className="flex gap-2">
            {(['today', 'week', 'month', 'all'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg text-lg transition ${
                  period === p
                    ? 'bg-[#69806C] text-white'
                    : 'bg-gray-100 text-[#69806C] hover:bg-gray-200'
                }`}
              >
                {p === 'today' ? 'Today' : 
                 p === 'week' ? 'Last 7 Days' :
                 p === 'month' ? 'Last 30 Days' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">Loading sales data...</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Total Orders</p>
                <p className="text-3xl font-bold text-[#69806C]">{summary.totalOrders}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-[#69806C]">฿{summary.totalRevenue}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Avg Order Value</p>
                <p className="text-3xl font-bold text-[#69806C]">฿{summary.avgOrderValue.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <p className="text-gray-600 text-sm mb-2">Completion Rate</p>
                <p className="text-3xl font-bold text-[#69806C]">{summary.completionRate.toFixed(1)}%</p>
              </div>
            </div>

            {/* ✅ Enhanced Insights - Multiple Top Items */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Top Flavors */}
              <div className="bg-gradient-to-br from-[#69806C] to-[#947E5A] rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  🍧 Top Flavors
                </h3>
                {summary.topFlavors.length > 0 ? (
                  <div className="space-y-3">
                    {summary.topFlavors.map((flavor, idx) => (
                      <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">#{idx + 1} {flavor.name}</span>
                          <span className="text-2xl font-bold">{flavor.count}</span>
                        </div>
                        <p className="text-sm text-white/80 mt-1">orders</p>
                      </div>
                    ))}
                    {summary.topFlavors.length > 1 && (
                      <p className="text-xs text-white/70 italic mt-2">
                        🔥 {summary.topFlavors.length} flavors tied for #1!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/70">No data available</p>
                )}
              </div>

              {/* Top Toppings */}
              <div className="bg-gradient-to-br from-[#947E5A] to-[#69806C] rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  🍓 Top Toppings
                </h3>
                {summary.topToppings.length > 0 ? (
                  <div className="space-y-3">
                    {summary.topToppings.map((topping, idx) => (
                      <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">#{idx + 1} {topping.name}</span>
                          <span className="text-2xl font-bold">{topping.count}</span>
                        </div>
                        <p className="text-sm text-white/80 mt-1">orders</p>
                      </div>
                    ))}
                    {summary.topToppings.length > 1 && (
                      <p className="text-xs text-white/70 italic mt-2">
                        🔥 {summary.topToppings.length} toppings tied for #1!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/70">No data available</p>
                )}
              </div>

              {/* Peak Times */}
              <div className="bg-gradient-to-br from-[#69806C] to-[#947E5A] rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  ⏰ Peak Times
                </h3>
                {summary.peakTimes.length > 0 ? (
                  <div className="space-y-3">
                    {summary.peakTimes.map((peak, idx) => (
                      <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold">{peak.timeRange}</span>
                          <span className="text-2xl font-bold">{peak.count}</span>
                        </div>
                        <p className="text-sm text-white/80 mt-1">orders</p>
                      </div>
                    ))}
                    {summary.peakTimes.length > 1 && (
                      <p className="text-xs text-white/70 italic mt-2">
                        🔥 {summary.peakTimes.length} time slots tied for peak!
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-white/70">No data available</p>
                )}
              </div>
            </div>

            {/* Top Combinations */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-2xl text-[#69806C] mb-4">🎯 Top Flavor + Topping Combinations</h3>
              {summary.topCombinations.length > 0 ? (
                <div className="space-y-3">
                  {summary.topCombinations.map((combo, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#947E5A]">#{idx + 1}</span>
                        <span className="text-lg">{combo.combo}</span>
                      </div>
                      <span className="text-xl font-bold text-[#69806C]">{combo.count} orders</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No combination data available</p>
              )}
            </div>

            {/* Daily Sales Table */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-2xl text-[#69806C] mb-4">📊 Daily Sales Breakdown</h3>
              
              {salesData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sales data for the selected period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#69806C]">
                        <th className="text-left py-2 px-4">Date</th>
                        <th className="text-center py-2 px-4">Orders</th>
                        <th className="text-right py-2 px-4">Revenue</th>
                        <th className="text-right py-2 px-4">Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((data, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{data.date}</td>
                          <td className="text-center py-2 px-4">{data.orders}</td>
                          <td className="text-right py-2 px-4">฿{data.revenue}</td>
                          <td className="text-right py-2 px-4">฿{data.avgOrderValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#69806C] font-bold">
                        <td className="py-2 px-4">Total</td>
                        <td className="text-center py-2 px-4">{summary.totalOrders}</td>
                        <td className="text-right py-2 px-4">฿{summary.totalRevenue}</td>
                        <td className="text-right py-2 px-4">฿{summary.avgOrderValue.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Export Button */}
            <div className="flex justify-center">
              <button
                onClick={exportToCSV}
                disabled={salesData.length === 0}
                className="px-8 py-3 bg-[#69806C] text-white rounded-lg hover:bg-[#5a6e5e] transition text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 Export as CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}