// src/pages/cart/index.tsx - Gallery with Images, Prices from MongoDB

import { useState, useEffect } from 'react';
import Link from "next/link";
import { api } from '@/utils/api';

interface MenuItem {
  _id: string;
  name: string;
  image: string;
  price: number;
  available: boolean;
  stock: number;
}

export default function GalleryPage() {
  const [bingsuMenu, setBingsuMenu] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Default images for fallback
  const defaultImages: { [key: string]: string } = {
    'Strawberry': '/images/strawberry-ice.png',
    'Thai Tea': '/images/thai-tea-ice.png',
    'Matcha': '/images/matcha-ice.png',
    'Apple': '/images/apple.png',
    'Cherry': '/images/cherry.png',
    'Blueberry': '/images/blueberry.png',
    'Raspberry': '/images/raspberry.png',
  };

  useEffect(() => {
    loadMenuAndStock();
  }, []);

  const loadMenuAndStock = async () => {
    setLoading(true);
    try {
      // ✅ Load menu from MongoDB
      const menuResult = await api.getMenu();
      
      // ✅ Load stock status
      const [flavorsStock, toppingsStock] = await Promise.all([
        api.getAvailableItems('flavor'),
        api.getAvailableItems('topping')
      ]);

      // ✅ Map flavors from MongoDB with stock
      const flavorsWithStock = (menuResult.flavors || []).map((menuItem: any) => {
        const stockItem = flavorsStock.items?.find((s: any) => 
          s.name.toLowerCase() === menuItem.name.toLowerCase()
        );
        
        return {
          _id: menuItem._id,
          name: menuItem.name,
          image: menuItem.image || defaultImages[menuItem.name] || '/images/strawberry-ice.png',
          price: menuItem.price || 60,
          available: stockItem ? stockItem.isActive && stockItem.quantity > 0 : menuItem.isActive,
          stock: stockItem?.quantity || 0
        };
      });

      // ✅ Map toppings from MongoDB with stock
      const toppingsWithStock = (menuResult.toppings || []).map((menuItem: any) => {
        const stockItem = toppingsStock.items?.find((s: any) => 
          s.name.toLowerCase() === menuItem.name.toLowerCase()
        );
        
        return {
          _id: menuItem._id,
          name: menuItem.name,
          image: menuItem.image || defaultImages[menuItem.name] || '/images/apple.png',
          price: menuItem.price || 10,
          available: stockItem ? stockItem.isActive && stockItem.quantity > 0 : menuItem.isActive,
          stock: stockItem?.quantity || 0
        };
      });

      setBingsuMenu(flavorsWithStock);
      setToppings(toppingsWithStock);
    } catch (error) {
      console.error('Failed to load menu:', error);
      setBingsuMenu([]);
      setToppings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EBE6DE]">
      {/* Header */}
      <div className="w-full bg-[#69806C] py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <Link href="/home">
            <button className="text-white hover:bg-white/20 p-2 rounded-full transition">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </Link>
          <h1 className="text-4xl md:text-5xl font-['Iceland'] text-white text-center">
            Bingsu Menu Gallery
          </h1>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#69806C] mx-auto mb-4"></div>
            <p className="text-gray-500 font-['Iceland']">Loading menu from database...</p>
          </div>
        ) : (
          <>
            {/* Bingsu Gallery */}
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-3xl font-['Iceland'] text-[#69806C]">Bingsu Flavors</h2>
              
            </div>

            {bingsuMenu.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center mb-16">
                <div className="text-6xl mb-4">🍧</div>
                <p className="text-gray-500 font-['Iceland'] text-lg mb-4">
                  No flavors available. Please contact admin to add menu items.
                </p>
                <Link href="/admin/data-management">
                  <button className="px-6 py-3 bg-[#69806C] text-white rounded-lg font-['Iceland'] hover:bg-[#5a6e5e]">
                    Go to Admin Panel
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {bingsuMenu.map((item) => (
                  <div
                    key={item._id}
                    className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {/* Stock Status Badge */}
                    <div className={`absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-sm font-['Iceland'] font-bold ${
                      !item.available || item.stock === 0
                        ? 'bg-red-600 text-white' 
                        : item.stock <= 10 
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {item.stock === 0 || !item.available ? 'Out of Stock' : item.stock <= 10 ? `Only ${item.stock} left!` : 'Available'}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-4 left-4 z-20 bg-[#69806C] text-white px-3 py-1 rounded-full text-lg font-['Iceland'] font-bold shadow-lg">
                      ฿{item.price}
                    </div>
                    
                    <img
                      src={item.image}
                      alt={item.name}
                      className={`h-[500px] w-full object-cover object-[center_70%] bg-white ${
                        !item.available ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-white text-2xl font-['Iceland'] drop-shadow-lg mb-1">
                        {item.name} Bingsu
                      </h3>
                      <p className="text-white/90 text-sm font-['Iceland']">
                        Base price • Add toppings for more!
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Topping Gallery */}
            <h2 className="text-3xl font-['Iceland'] text-[#69806C] mb-8">Toppings</h2>
            
            {toppings.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🍓</div>
                <p className="text-gray-500 font-['Iceland'] text-lg mb-4">
                  No toppings available. Please contact admin to add menu items.
                </p>
                <Link href="/admin/data-management">
                  <button className="px-6 py-3 bg-[#69806C] text-white rounded-lg font-['Iceland'] hover:bg-[#5a6e5e]">
                    Go to Admin Panel
                  </button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-16">
                {toppings.map((topping) => (
                  <div
                    key={topping._id}
                    className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white"
                  >
                    {/* Stock Status Badge */}
                    <div className={`absolute top-2 right-2 z-20 px-2 py-1 rounded-full text-xs font-['Iceland'] font-bold ${
                      !topping.available 
                        ? 'bg-red-600 text-white' 
                        : topping.stock <= 10 
                        ? 'bg-yellow-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}>
                      {!topping.available ? 'Out' : topping.stock <= 10 ? `${topping.stock} left` : 'In Stock'}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-2 left-2 z-20 bg-[#947E5A] text-white px-2 py-1 rounded-full text-sm font-['Iceland'] font-bold shadow-md">
                      +฿{topping.price}
                    </div>
                    
                    <img
                      src={topping.image}
                      alt={topping.name}
                      className={`h-60 w-full object-contain p-4 ${
                        !topping.available ? 'opacity-50 grayscale' : ''
                      }`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                      <h3 className="text-white text-lg font-['Iceland'] drop-shadow-md text-center">
                        {topping.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Info Section */}
            <div className="mt-16 p-8 bg-white rounded-xl shadow-lg">
              <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4"> Menu Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-['Iceland'] text-lg text-gray-700 mb-2"> Size Options</h4>
                  <ul className="space-y-1 text-gray-600 font-['Iceland']">
                    <li>• Size S: No extra charge</li>
                    <li>• Size M: +฿10</li>
                    <li>• Size L: +฿20</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-['Iceland'] text-lg text-gray-700 mb-2"> Toppings</h4>
                  <ul className="space-y-1 text-gray-600 font-['Iceland']">
                    <li>• Prices shown above each topping</li>
                    <li>• Maximum 3 toppings per order</li>
                    <li>• All toppings are fresh daily</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 font-['Iceland'] text-center">
                   <strong>Tip:</strong> Get a menu code from our staff to start your order!
                </p>
              </div>

             
            </div>
          </>
        )}
      </div>
    </div>
  );
}