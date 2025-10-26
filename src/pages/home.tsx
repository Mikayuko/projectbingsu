// src/pages/home.tsx - Fixed: Dynamic Admin/Login Button

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import HeaderExclude from '../components/HeaderExclude';
import { api, isAuthenticated, isAdmin, getCurrentUser } from '@/utils/api';

interface PopularItem {
  flavor: string;
  count: number;
  image: string;
}

interface RecentReview {
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface StockStatus {
  totalItems: number;
  lowStock: number;
  outOfStock: number;
}

export default function HomePage() {
  const router = useRouter();
  const [menuCode, setMenuCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [stockStatus, setStockStatus] = useState<StockStatus>({ totalItems: 0, lowStock: 0, outOfStock: 0 });
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeCodes, setActiveCodes] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  
  // ✅ Auth State
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  // ✅ แก้ไขส่วน useEffect และเพิ่ม checkAuthStatus
useEffect(() => {
  setMounted(true);
  checkAuthStatus(); // เรียกทันที
  fetchAllData();
  
  // ✅ เพิ่มการตรวจสอบทุก 1 วินาที
  const interval = setInterval(() => {
    checkAuthStatus();
  }, 1000);
  
  // ✅ ฟัง storage events (เมื่อ login/logout)
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'token' || e.key === 'user') {
      checkAuthStatus();
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    clearInterval(interval);
    window.removeEventListener('storage', handleStorageChange);
  };
}, []);

const checkAuthStatus = () => {
  const loggedIn = isAuthenticated();
  const adminStatus = isAdmin();
  
  // ✅ Update state เฉพาะเมื่อเปลี่ยนแปลง
  if (loggedIn !== isLoggedIn) {
    setIsLoggedIn(loggedIn);
  }
  if (adminStatus !== isUserAdmin) {
    setIsUserAdmin(adminStatus);
  }
};

  const fetchAllData = async () => {
    await Promise.all([
      fetchPopularItems(),
      fetchRecentReviews(),
      fetchStockStatus(),
      fetchStats()
    ]);
  };

  const fetchPopularItems = async () => {
    try {
      const result = await api.getOrderStats();
      const flavors = result.popularFlavors || [];
      
      const flavorImages: { [key: string]: string } = {
        'Strawberry': '/images/strawberry-ice.png',
        'Thai Tea': '/images/thai-tea-ice.png',
        'Matcha': '/images/matcha-ice.png',
      };

      const items = flavors.slice(0, 3).map((f: any) => ({
        flavor: f._id,
        count: f.count,
        image: flavorImages[f._id] || '/images/strawberry-ice.png'
      }));

      setPopularItems(items);
    } catch (error) {
      console.error('Failed to fetch popular items:', error);
      setPopularItems([
        { flavor: 'Strawberry', count: 25, image: '/images/strawberry-ice.png' },
        { flavor: 'Matcha', count: 20, image: '/images/matcha-ice.png' },
        { flavor: 'Thai Tea', count: 18, image: '/images/thai-tea-ice.png' },
      ]);
    }
  };

  const fetchRecentReviews = async () => {
    try {
      const result = await api.getReviews(1, 3);
      setRecentReviews(result.reviews || []);
      if (result.stats) {
        setAverageRating(result.stats.average || 0);
        setTotalReviews(result.totalReviews || 0);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setRecentReviews([]);
    }
  };

  const fetchStockStatus = async () => {
    try {
      const result = await api.getStock();
      const allItems = [...(result.flavors || []), ...(result.toppings || [])];
      
      setStockStatus({
        totalItems: allItems.length,
        lowStock: result.lowStock?.length || 0,
        outOfStock: allItems.filter((item: any) => item.quantity === 0).length
      });
    } catch (error) {
      console.error('Failed to fetch stock status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const orderResult = await api.getOrderStats();
      setTotalOrders(orderResult.todayOrders || 0);
      setActiveCodes(10);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleConfirm = async () => {
    if (menuCode.trim().length !== 5) {
      setError('Please enter a valid 5-character menu code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await api.validateMenuCode(menuCode.toUpperCase());
      
      if (result.valid) {
        router.push(`/menu?code=${menuCode.toUpperCase()}`);
      } else {
        setError(result.message || 'Invalid or expired menu code');
      }
    } catch (err: any) {
      console.error('Code validation error:', err);
      setError('Failed to validate menu code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Admin button click
  const handleAdminClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }
    
    if (!isUserAdmin) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้า Admin\nเฉพาะผู้ดูแลระบบเท่านั้น');
      return;
    }
    
    router.push('/admin');
  };

  // ✅ Prevent hydration error
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative w-full min-h-screen bg-[#EBE6DE]">
      {/* Header with Dynamic Navigation */}
      <div className="px-4 md:px-10 lg:px-20 py-10">
        <div className="relative w-full max-w-7xl mx-auto h-[400px] rounded-[20px] overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 2000 600"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <mask id="mask-xor">
                <rect width="3000" height="600" rx="20" fill="white" />
                <rect x="0" y="400" width="900" height="200" rx="10" fill="black" />
              </mask>
            </defs>
            <rect width="3000" height="600" rx="20" fill="#D9D9D9" mask="url(#mask-xor)" />
            <image
              xlinkHref="/images/ชาเขียว.jpg"
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="xMidYMid slice"
              mask="url(#mask-xor)"
            />
          </svg>

          {/* ✅ Dynamic Navigation Buttons */}
          <div className="absolute top-[280px] left-0 right-0 flex flex-wrap gap-4">
            {/* Profile/Login Button */}
            <Link href={isLoggedIn ? "/profile" : "/login"}>
              <div className="cursor-pointer flex flex-col justify-center items-center w-[100px] h-[100px] bg-[#69806C] rounded-[5px] shadow-[0_0_10px_rgba(0,0,0,0.25),0_10px_30px_rgba(0,0,0,0.25)] text-white font-['Iceland'] text-[24px] transition hover:scale-105">
                {isLoggedIn ? "Profile" : "Login"}
              </div>
            </Link>

            {/* Menu Button */}
            <Link href="/cart">
              <div className="cursor-pointer flex flex-col justify-center items-center w-[100px] h-[100px] bg-[#69806C] rounded-[5px] shadow-[0_0_10px_rgba(0,0,0,0.25),0_10px_30px_rgba(0,0,0,0.25)] text-white font-['Iceland'] text-[24px] transition hover:scale-105">
                Menu
              </div>
            </Link>

            {/* Review Button */}
            <Link href="/review">
              <div className="cursor-pointer flex flex-col justify-center items-center w-[100px] h-[100px] bg-[#69806C] rounded-[5px] shadow-[0_0_10px_rgba(0,0,0,0.25),0_10px_30px_rgba(0,0,0,0.25)] text-white font-['Iceland'] text-[24px] transition hover:scale-105">
                Review
              </div>
            </Link>

            {/* Order Button */}
            <Link href="/order">
              <div className="cursor-pointer flex flex-col justify-center items-center w-[100px] h-[100px] bg-[#69806C] rounded-[5px] shadow-[0_0_10px_rgba(0,0,0,0.25),0_10px_30px_rgba(0,0,0,0.25)] text-white font-['Iceland'] text-[24px] transition hover:scale-105">
                Order
              </div>
            </Link>

            {/* ✅ Admin Button - Show only for logged-in Admin */}
            {isLoggedIn && isUserAdmin && (
              <div
                onClick={handleAdminClick}
                className="cursor-pointer flex flex-col justify-center items-center w-[100px] h-[100px] bg-[#69806C] rounded-[5px] shadow-[0_0_10px_rgba(0,0,0,0.25),0_10px_30px_rgba(0,0,0,0.25)] text-white font-['Iceland'] text-[24px] transition hover:scale-105"
              >
                Admin
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Section with Live Stats */}
      <div className="w-full bg-gradient-to-r from-[#69806C] to-[#947E5A] py-16 px-4 mb-12">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl text-white font-['Iceland'] mb-4 drop-shadow-lg">
            Welcome to Bingsu Paradise! 
          </h1>
          <p className="text-xl md:text-2xl text-white/90 font-['Iceland'] mb-6">
            Cool down with our signature Korean shaved ice
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-['Iceland'] text-sm">📊 Today's Orders</span>
              <p className="text-white font-bold text-xl">{totalOrders}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-['Iceland'] text-sm">📦 Stock Status</span>
              <p className="text-white font-bold text-xl">
                {stockStatus.outOfStock > 0 ? `⚠️ ${stockStatus.outOfStock} Out` : '✅ All Good'}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <span className="text-white font-['Iceland'] text-sm">⭐ Rating</span>
              <p className="text-white font-bold text-xl">
                {averageRating > 0 ? averageRating.toFixed(1) : '—'}/5
              </p>
            </div>
          </div>
          
          <div className="inline-block bg-yellow-400 text-[#543429] px-6 py-3 rounded-full font-['Iceland'] text-xl font-bold shadow-lg animate-pulse">
            🎉 Buy 9, Get 1 FREE! 🎉
          </div>
        </div>
      </div>

      {/* Stock Alert */}
      {/* {stockStatus.outOfStock > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-8">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-800 font-['Iceland'] text-lg">
              ⚠️ {stockStatus.outOfStock} item(s) currently out of stock. 
              {stockStatus.lowStock > 0 && ` ${stockStatus.lowStock} item(s) running low.`}
            </p>
          </div>
        </div>
      )} */}

      {/* Popular Items Section */}
      {popularItems.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-8 text-center drop-shadow">
            🔥 Popular Flavors Today
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {popularItems.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:scale-105 transition duration-300">
                <div className="relative h-80">
                  <img 
                    src={item.image} 
                    alt={item.flavor}
                    className="w-full h-full object-cover object-[center_60%]"
                  />
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full font-['Iceland'] text-sm">
                    #{idx + 1} Best Seller
                  </div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-2xl font-['Iceland'] text-[#543429] mb-2">
                    {item.flavor} Bingsu
                  </h3>
                  <p className="text-gray-600 font-['Iceland']">
                    🔥 {item.count} orders today!
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Now Section */}
      <div className="w-full bg-[#947E5A] py-16 px-4 mb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl text-white font-['Iceland'] mb-4 text-center drop-shadow">
            Start Your Order
          </h2>
          <p className="text-white/90 font-['Iceland'] text-lg mb-8 text-center">
            Enter your menu code to begin
          </p>

          {error && (
            <div className="max-w-xl mx-auto mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded font-['Iceland'] text-sm">
              {error}
            </div>
          )}

          <div className="max-w-xl mx-auto flex flex-col gap-4">
            <div className="bg-[#EBE6DE] border-2 border-white shadow-2xl rounded-xl flex justify-center items-center px-6 py-4">
              <input
                type="text"
                placeholder="Enter Menu Code"
                value={menuCode}
                onChange={(e) => {
                  setMenuCode(e.target.value.toUpperCase());
                  setError('');
                }}
                maxLength={5}
                onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                className="w-full bg-transparent outline-none text-3xl font-['Iceland'] text-[#69806C] placeholder-[#69806C]/50 text-center tracking-widest"
                disabled={loading}
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading || menuCode.length !== 5}
              className="w-full py-4 bg-[#EBE6DE] border-2 border-white shadow-2xl rounded-xl text-[#69806C] text-3xl font-['Iceland'] hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Validating...' : 'Confirm & Order Now'}
            </button>

            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <p className="text-white/90 font-['Iceland'] text-sm">
                💡 Get your menu code from our staff
              </p>
              <p className="text-white/70 font-['Iceland'] text-xs mt-1">
                {activeCodes} active codes available
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reviews Section */}
      {recentReviews.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 mb-16">
          <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-8 text-center drop-shadow">
            ⭐ What Our Customers Say
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentReviews.map((review, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-['Iceland'] text-lg text-[#543429] font-bold">
                    {review.customerName}
                  </span>
                  <span className="text-yellow-400 text-xl">
                    {'★'.repeat(review.rating)}
                  </span>
                </div>
                <p className="text-gray-700 font-['Iceland'] text-sm mb-3">
                  "{review.comment}"
                </p>
                <p className="text-gray-400 font-['Iceland'] text-xs">
                  {new Date(review.createdAt).toLocaleDateString('th-TH')}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/review">
              <button className="px-6 py-3 bg-[#947E5A] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#7a6648] transition shadow-md">
                See All Reviews →
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Gallery Preview */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <h2 className="text-4xl text-[#69806C] font-['Iceland'] mb-8 text-center drop-shadow">
          📸 Our Delicious Menu
        </h2>
        
        <div className="text-center">
          <Link href="/cart">
            <button className="px-8 py-4 bg-[#69806C] text-white font-['Iceland'] text-xl rounded-lg hover:bg-[#5a6e5e] transition shadow-lg">
              View Full Menu Gallery →
            </button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">🍧</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Fresh Daily</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">
              {stockStatus.totalItems} items in stock
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">⚡</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Quick Service</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">
              {totalOrders} orders served today
            </p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">🎁</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Loyalty Rewards</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">Earn stamps for free drinks</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-2xl transition">
            <div className="text-5xl mb-3">🌟</div>
            <h3 className="text-xl font-['Iceland'] text-[#69806C] mb-2">Top Rated</h3>
            <p className="text-gray-600 font-['Iceland'] text-sm">
              {totalReviews > 0 ? `${totalReviews} reviews` : '500+ reviews'}
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full bg-[#543429] text-white py-8 px-4 mt-0">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-['Iceland'] text-lg mb-2">
            © 2025 Bingsu Order Management System
          </p>
        </div>
      </div>
    </div>
  );
}