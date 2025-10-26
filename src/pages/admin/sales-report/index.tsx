// src/pages/admin/sales-report/index.tsx - Fixed: Correct Completion Rate Calculation

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
  time: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

interface TopItem {
  name: string;
  count: number;
  rank?: number;
}

interface PeakTime {
  timeRange: string;
  count: number;
  rank?: number;
}

interface TopCombo {
  combo: string;
  count: number;
  rank?: number;
}

export default function SalesReportPage() {
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
    topCombinations: [] as TopCombo[],
    completionRate: 0,
    completedCount: 0,
    cancelledCount: 0,
    allOrdersCount: 0
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
      calculateSalesData(allOrders);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      setOrders([]);
      calculateSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSalesData = (allOrders: Order[]) => {
    const now = new Date();
    
    // กรองตาม period
    const filteredAllOrders = allOrders.filter(order => {
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

    // แยกนับตาม status
    const completedOrders = filteredAllOrders.filter(order => order.status === 'Completed');
    const allOrdersInPeriod = filteredAllOrders.length;
    const completedCount = completedOrders.length;

    // ✅ Completion Rate = (Completed / Total) * 100
    const completionRate = allOrdersInPeriod > 0 
      ? (completedCount / allOrdersInPeriod) * 100 
      : 0;

    // ✅ ใช้เฉพาะ Completed orders สำหรับคำนวณ Sales
    const groupedData: { [key: string]: Order[] } = {};
    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const dateKey = orderDate.toLocaleDateString('th-TH');
      const timeKey = orderDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      const fullKey = `${dateKey} ${timeKey}`;
      
      if (!groupedData[fullKey]) groupedData[fullKey] = [];
      groupedData[fullKey].push(order);
    });

    const dailySales: SalesData[] = Object.entries(groupedData).map(([dateTime, orders]) => {
      const [date, time] = dateTime.split(' ');
      return {
        date,
        time,
        orders: orders.length,
        revenue: orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0),
        avgOrderValue: orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0) / orders.length
      };
    }).sort((a, b) => new Date(`${b.date} ${b.time}`).getTime() - new Date(`${a.date} ${a.time}`).getTime());

    setSalesData(dailySales);

    const totalOrders = completedCount;
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

    // Top Flavors (Completed only)
    const flavorCount: { [key: string]: number } = {};
    completedOrders.forEach(order => {
      const flavor = order.shavedIce?.flavor || 'Unknown';
      flavorCount[flavor] = (flavorCount[flavor] || 0) + 1;
    });
    
    const flavorsSorted = Object.entries(flavorCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    const topFlavors: TopItem[] = [];
    let currentRank = 1;
    for (let i = 0; i < flavorsSorted.length; i++) {
      if (i > 0 && flavorsSorted[i].count !== flavorsSorted[i - 1].count) {
        currentRank++;
      }
      topFlavors.push({ ...flavorsSorted[i], rank: currentRank });
    }

    // Top Toppings (Completed only)
    const toppingCount: { [key: string]: number } = {};
    completedOrders.forEach(order => {
      order.toppings?.forEach(topping => {
        toppingCount[topping.name] = (toppingCount[topping.name] || 0) + 1;
      });
    });
    
    const toppingsSorted = Object.entries(toppingCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    const topToppings: TopItem[] = [];
    let toppingRank = 1;
    for (let i = 0; i < toppingsSorted.length; i++) {
      if (i > 0 && toppingsSorted[i].count !== toppingsSorted[i - 1].count) {
        toppingRank++;
      }
      topToppings.push({ ...toppingsSorted[i], rank: toppingRank });
    }

    // Peak Times (Completed only)
    const hourCount: { [key: string]: number } = {};
    completedOrders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      const timeRange = `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
      hourCount[timeRange] = (hourCount[timeRange] || 0) + 1;
    });
    
    const peakTimesSorted = Object.entries(hourCount)
      .map(([timeRange, count]) => ({ timeRange, count }))
      .sort((a, b) => b.count - a.count);
    
    const peakTimes: PeakTime[] = [];
    let peakRank = 1;
    for (let i = 0; i < peakTimesSorted.length; i++) {
      if (i > 0 && peakTimesSorted[i].count !== peakTimesSorted[i - 1].count) {
        peakRank++;
      }
      peakTimes.push({ ...peakTimesSorted[i], rank: peakRank });
    }

    // Top Combinations (Completed only)
    const comboCount: { [key: string]: number } = {};
    completedOrders.forEach(order => {
      const toppings = order.toppings?.map(t => t.name).sort().join(', ') || 'No toppings';
      const combo = `${order.shavedIce?.flavor} + ${toppings}`;
      comboCount[combo] = (comboCount[combo] || 0) + 1;
    });
    
    const combosSorted = Object.entries(comboCount)
      .map(([combo, count]) => ({ combo, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const topCombinations: TopCombo[] = [];
    let comboRank = 1;
    for (let i = 0; i < combosSorted.length; i++) {
      if (i > 0 && combosSorted[i].count !== combosSorted[i - 1].count) {
        comboRank++;
      }
      topCombinations.push({ ...combosSorted[i], rank: comboRank });
    }

    setSummary({
      totalOrders,
      totalRevenue,
      avgOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      topFlavors,
      topToppings,
      peakTimes,
      topCombinations,
      completionRate,
      completedCount,
      cancelledCount: 0,
      allOrdersCount: allOrdersInPeriod
    });
  };

  const exportToCSV = () => {
    let csv = 'Date,Time,Orders,Revenue,Avg Order Value\n';
    salesData.forEach(data => {
      csv += `${data.date},${data.time},${data.orders},${data.revenue},${data.avgOrderValue.toFixed(2)}\n`;
    });
    
    csv += '\n\nSummary\n';
    csv += `Period,${period}\n`;
    csv += `Total Completed Orders,${summary.totalOrders}\n`;
    csv += `Total Revenue,${summary.totalRevenue}\n`;
    csv += `Avg Order Value,${summary.avgOrderValue.toFixed(2)}\n`;
    csv += `Completion Rate,${summary.completionRate.toFixed(1)}%\n\n`;
    
    csv += 'Top Flavors (Completed Orders)\n';
    summary.topFlavors.forEach((f) => {
      csv += `${f.rank}. ${f.name},${f.count}\n`;
    });
    
    csv += '\nTop Toppings (Completed Orders)\n';
    summary.topToppings.forEach((t) => {
      csv += `${t.rank}. ${t.name},${t.count}\n`;
    });
    
    csv += '\nPeak Times (Completed Orders)\n';
    summary.peakTimes.forEach((p) => {
      csv += `${p.rank}. ${p.timeRange},${p.count}\n`;
    });
    
    const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv);
    const exportFileDefaultName = `sales_report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE] font-['Iceland']">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(105, 128, 108, 0.1);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(105, 128, 108, 0.5);
          border-radius: 10px;
          transition: background 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(105, 128, 108, 0.7);
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(105, 128, 108, 0.5) rgba(105, 128, 108, 0.1);
        }
      `}</style>

      <div className="w-full h-[80px] bg-[#69806C] flex items-center px-6 shadow-lg">
        <Link href="/admin">
          <div className="text-white text-2xl hover:opacity-80 cursor-pointer">{'<'}</div>
        </Link>
        <h1 className="ml-6 text-white text-3xl">Sales Report</h1>
      </div>

      <div className="max-w-7xl mx-auto p-6">
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
                <p className={`text-3xl font-bold ${summary.completionRate >= 80 ? 'text-green-600' : summary.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {summary.completionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Top Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gradient-to-br from-[#69806C] to-[#947E5A] rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4">🍧 Top Flavors</h3>
                {summary.topFlavors.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {(() => {
                      const grouped: { [key: number]: { names: string[], count: number } } = {};
                      summary.topFlavors.forEach(flavor => {
                        const rank = flavor.rank || 0;
                        if (!grouped[rank]) grouped[rank] = { names: [], count: flavor.count };
                        grouped[rank].names.push(flavor.name);
                      });
                      return Object.entries(grouped).map(([rank, data]) => (
                        <div key={rank} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex justify-between items-center">
                          <span className="font-bold">#{rank} {data.names.join(', ')}</span>
                          <span className="text-xl font-bold">{data.count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-white/70">No data</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-[#947E5A] to-[#69806C] rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4">🍓 Top Toppings</h3>
                {summary.topToppings.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {(() => {
                      const grouped: { [key: number]: { names: string[], count: number } } = {};
                      summary.topToppings.forEach(topping => {
                        const rank = topping.rank || 0;
                        if (!grouped[rank]) grouped[rank] = { names: [], count: topping.count };
                        grouped[rank].names.push(topping.name);
                      });
                      return Object.entries(grouped).map(([rank, data]) => (
                        <div key={rank} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex justify-between items-center">
                          <span className="font-bold">#{rank} {data.names.join(', ')}</span>
                          <span className="text-xl font-bold">{data.count}</span>
                        </div>
                      ));
                    })()}
                  </div>
                ) : (
                  <p className="text-white/70">No data</p>
                )}
              </div>

              <div className="bg-gradient-to-br from-[#69806C] to-[#947E5A] rounded-lg shadow-xl p-6 text-white">
                <h3 className="text-2xl font-bold mb-4">⏰ Peak Times</h3>
                {summary.peakTimes.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                    {summary.peakTimes.map((peak, idx) => (
                      <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex justify-between items-center">
                        <span className="font-bold">#{peak.rank} {peak.timeRange}</span>
                        <span className="text-xl font-bold">{peak.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/70">No data</p>
                )}
              </div>
            </div>

            {/* Top Combinations */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-2xl text-[#69806C] mb-4">🎯 Top Combinations</h3>
              {summary.topCombinations.length > 0 ? (
                <div className="space-y-3">
                  {summary.topCombinations.map((combo, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-[#947E5A]">#{combo.rank}</span>
                        <span className="text-lg">{combo.combo}</span>
                      </div>
                      <span className="text-xl font-bold text-[#69806C]">{combo.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No data</p>
              )}
            </div>

            {/* Daily Sales with Time */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-2xl text-[#69806C] mb-4">📊 Sales Breakdown</h3>
              
              {salesData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No completed orders in this period</p>
              ) : (
                <div className="max-h-96 overflow-y-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-[#69806C]">
                        <th className="text-left py-2 px-4">Date</th>
                        <th className="text-left py-2 px-4">Time</th>
                        <th className="text-center py-2 px-4">Orders</th>
                        <th className="text-right py-2 px-4">Revenue</th>
                        <th className="text-right py-2 px-4">Avg Order</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.map((data, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4">{data.date}</td>
                          <td className="py-2 px-4">{data.time}</td>
                          <td className="text-center py-2 px-4">{data.orders}</td>
                          <td className="text-right py-2 px-4">฿{data.revenue}</td>
                          <td className="text-right py-2 px-4">฿{data.avgOrderValue.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-[#69806C] font-bold">
                        <td className="py-2 px-4" colSpan={2}>Total</td>
                        <td className="text-center py-2 px-4">{summary.completedCount}</td>
                        <td className="text-right py-2 px-4">฿{summary.totalRevenue}</td>
                        <td className="text-right py-2 px-4">฿{summary.avgOrderValue.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={exportToCSV}
                disabled={salesData.length === 0}
                className="px-8 py-3 bg-[#69806C] text-white rounded-lg hover:bg-[#5a6e5e] transition text-lg disabled:opacity-50"
              >
                📊 Export CSV
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}