// src/pages/menu/index.tsx

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';

interface MenuItem {
  name: string;
  score: number;
  description: string;
  image: string;
  color?: string;
  textColor?: string;
}

const shavedIceFlavors: MenuItem[] = [
  {
    name: 'Strawberry',
    score: 1,
    description: 'A sweet, icy kiss of summer! Burst of juicy strawberry flavor—cool, refreshing, and impossible to resist.',
    image: '/images/strawberry-ice.png',
    color: '#B23434',
  },
  {
    name: 'Thai Tea',
    score: 2,
    description: 'Bold. Creamy. Unmistakably Thai. Rich aroma of authentic Thai tea melts on your tongue with every icy bite.',
    image: '/images/thai-tea-ice.png',
    color: '#CD9445',
  },
  {
    name: 'Matcha',
    score: 3,
    description: 'Earthy. Creamy. Cool. Premium green tea meets the chill of shaved ice. Balanced—just like your zen.',
    image: '/images/matcha-ice.png',
    color: '#527657',
  },
];

const toppings: MenuItem[] = [
  { name: 'Apple', score: 1, description: 'Juicy crunch', image: '/images/apple.png', textColor: '#B51212' },
  { name: 'Cherry', score: 2, description: 'Sweet & tangy', image: '/images/cherry.png', textColor: '#B51212' },
  { name: 'Blueberry', score: 3, description: 'Sweet berries', image: '/images/blueberry.png', textColor: '#354088' },
  { name: 'Raspberry', score: 4, description: 'Bold & tangy', image: '/images/raspberry.png', textColor: '#B51212' },
  { name: 'Strawberry', score: 5, description: 'Sweet & juicy', image: '/images/strawberry.png', textColor: '#B51212' },
];

export default function MenuPage() {
  const router = useRouter();
  const { code } = router.query;
  
  const [menuCode, setMenuCode] = useState('');
  const [cupSize, setCupSize] = useState<string>('M');
  const [selectedFlavor, setSelectedFlavor] = useState<MenuItem | null>(null);
  const [selectedToppings, setSelectedToppings] = useState<MenuItem[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [customerCode, setCustomerCode] = useState('');

  useEffect(() => {
    if (code) {
      const codeStr = code as string;
      setMenuCode(codeStr.toUpperCase());
      
      // Check generated codes first
      const codeMap = JSON.parse(localStorage.getItem('menuCodeMap') || '{}');
      if (codeMap[codeStr.toUpperCase()]) {
        setCupSize(codeMap[codeStr.toUpperCase()]);
      } else {
        // Fallback to predefined codes
        const sizeMap: { [key: string]: string } = {
          'TEST1': 'S', 'TEST2': 'M', 'TEST3': 'L',
          'DEMO1': 'S', 'DEMO2': 'M', 'DEMO3': 'L',
          'ABC12': 'M', 'XYZ99': 'L', 'BING1': 'S', 'BING2': 'M'
        };
        setCupSize(sizeMap[codeStr.toUpperCase()] || 'M');
      }
      setShowOrderForm(true);
    }
  }, [code]);

  const toggleTopping = (topping: MenuItem) => {
    setSelectedToppings(prev => {
      const exists = prev.find(t => t.name === topping.name);
      if (exists) {
        return prev.filter(t => t.name !== topping.name);
      }
      if (prev.length >= 3) {
        setError('Maximum 3 toppings allowed');
        setTimeout(() => setError(''), 3000);
        return prev;
      }
      return [...prev, topping];
    });
  };

  const calculateTotal = () => {
    let total = 60; // Base price
    const sizePrice = { S: 0, M: 10, L: 20 };
    total += sizePrice[cupSize as keyof typeof sizePrice] || 0;
    total += selectedToppings.length * 10;
    return total;
  };

  const validateOrder = () => {
    const errors = [];
    
    if (!selectedFlavor) {
      errors.push('กรุณาเลือกรสชาติ Shaved Ice');
    }
    
    if (selectedToppings.length === 0) {
      errors.push('กรุณาเลือกท็อปปิ้งอย่างน้อย 1 อย่าง');
    }
    
    if (selectedToppings.length > 3) {
      errors.push('เลือกท็อปปิ้งได้สูงสุด 3 อย่าง');
    }
    
    if (!menuCode || menuCode.length !== 5) {
      errors.push('โค้ดเมนูไม่ถูกต้อง');
    }
    
    if (errors.length > 0) {
      setError(errors.join('\n'));
      return false;
    }
    
    return true;
  };

  const handleCreateOrder = async () => {
    if (!validateOrder()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate points
      const totalScore = selectedFlavor!.score + 
        selectedToppings.reduce((sum, t) => sum + t.score, 0);
      
      // Save points for non-logged in users
      if (!localStorage.getItem('token')) {
        const localPoints = parseInt(localStorage.getItem('userPoints') || '0');
        const newPoints = localPoints + totalScore;
        localStorage.setItem('userPoints', JSON.stringify(newPoints));
      }

      // Generate customer code
      let generatedCustomerCode = `#${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Create order object
      const order = {
        menuCode: menuCode.toUpperCase(),
        customerCode: generatedCustomerCode,
        cupSize,
        shavedIce: {
          flavor: selectedFlavor!.name,
          points: selectedFlavor!.score
        },
        toppings: selectedToppings.map(t => ({
          name: t.name,
          points: t.score
        })),
        pricing: {
          total: calculateTotal()
        },
        score: totalScore,
        specialInstructions,
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      // Save to localStorage
      const existingOrders = JSON.parse(localStorage.getItem('bingsuOrders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('bingsuOrders', JSON.stringify(existingOrders));
      
      // Try to send to backend
      try {
        const response = await fetch('http://localhost:5000/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
          },
          body: JSON.stringify({
            menuCode: menuCode.toUpperCase(),
            shavedIce: order.shavedIce,
            toppings: order.toppings,
            specialInstructions
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          generatedCustomerCode = result.customerCode || generatedCustomerCode;
        }
      } catch (apiError) {
        console.log('API not available, using local storage');
      }
      
      // Set customer code and show success modal
      setCustomerCode(generatedCustomerCode);
      setShowSuccessModal(true);
      
      // Add to cart
      const cartItem = {
        id: Date.now().toString(),
        cupSize,
        shavedIce: order.shavedIce,
        toppings: order.toppings,
        quantity: 1,
        price: calculateTotal(),
        specialInstructions
      };
      
      const cart = JSON.parse(localStorage.getItem('bingsuCart') || '[]');
      cart.push(cartItem);
      localStorage.setItem('bingsuCart', JSON.stringify(cart));
      
    } catch (err: any) {
      setError('Failed to create order. Please try again.');
      console.error('Order creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!showOrderForm) {
    return (
      <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center justify-center">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-md">
          <h2 className="text-2xl text-[#69806C] font-['Iceland'] mb-4 text-center">
            No Menu Code Detected
          </h2>
          <p className="text-gray-600 font-['Iceland'] mb-6 text-center">
            Please enter a menu code from the home page to start your order.
          </p>
          <Link href="/home">
            <button className="w-full py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition">
              Go to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center justify-start relative overflow-hidden">
      {/* Header */}
      <div className="w-full h-[100px] bg-[#69806C] flex items-center px-10 justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/home">
            <div className="w-12 h-12 bg-white/20 rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-white/30 transition">
              <span className="text-white text-2xl">{'<'}</span>
            </div>
          </Link>
          <h1 className="text-white text-3xl font-['Iceland']">Create Your Order</h1>
        </div>
        <div className="text-white font-['Iceland']">
          Code: <span className="font-bold text-xl">{menuCode}</span> | 
          Size: <span className="font-bold text-xl">{cupSize}</span>
        </div>
      </div>

      <div className="w-full max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland']">
            {error}
          </div>
        )}

        {/* Step 1: Shaved Ice Selection */}
        <div className="mb-12">
          <h3 className="text-3xl text-[#69806C] mb-6 text-center font-['Iceland']">
            Step 1: Select Shaved Ice Flavor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shavedIceFlavors.map((flavor) => (
              <div
                key={flavor.name}
                onClick={() => setSelectedFlavor(flavor)}
                className={`cursor-pointer rounded-lg border-2 transition bg-white overflow-hidden ${
                  selectedFlavor?.name === flavor.name
                    ? 'border-[#69806C] shadow-lg transform scale-105'
                    : 'border-gray-300 hover:border-[#69806C] hover:shadow-md'
                }`}
              >
                {/* Image section */}
                <div className="h-48 relative">
                  <img 
                    src={flavor.image} 
                    alt={flavor.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.classList.remove('hidden');
                      }
                    }}
                  />
                  <div 
                    className="hidden absolute inset-0 flex items-center justify-center text-6xl" 
                    style={{ backgroundColor: (flavor.color || '#69806C') + '20' }}
                  >
                    🍧
                  </div>
                </div>
                
                {/* Flavor details */}
                <div className="p-6">
                  <h4 
                    className="text-2xl font-['Iceland'] mb-2 text-center" 
                    style={{ color: flavor.color || '#69806C' }}
                  >
                    {flavor.name}
                  </h4>
                  <p className="text-sm text-gray-600 text-center">{flavor.description}</p>
                  {selectedFlavor?.name === flavor.name && (
                    <div className="mt-2 text-center text-green-600 font-bold">✓ Selected</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Toppings Selection */}
        <div className="mb-12">
          <h3 className="text-3xl text-[#69806C] mb-6 text-center font-['Iceland']">
            Step 2: Select Toppings (Max 3)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {toppings.map((topping) => (
              <div
                key={topping.name}
                onClick={() => toggleTopping(topping)}
                className={`cursor-pointer rounded-lg border-2 transition text-center bg-white overflow-hidden ${
                  selectedToppings.find(t => t.name === topping.name)
                    ? 'border-[#69806C] shadow-lg transform scale-105'
                    : 'border-gray-300 hover:border-[#69806C] hover:shadow-md'
                }`}
              >
                {/* Topping image */}
                <div className="h-20 relative">
                  <img 
                    src={topping.image} 
                    alt={topping.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const nextElement = target.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center text-2xl bg-gray-100">
                    🍓
                  </div>
                </div>
                
                {/* Topping name */}
                <div className="p-2">
                  <h4 className="text-lg font-['Iceland']" style={{ color: topping.textColor || '#69806C' }}>
                    {topping.name}
                  </h4>
                  {selectedToppings.find(t => t.name === topping.name) && (
                    <div className="mt-1 text-green-600 font-bold">✓</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Special Instructions */}
        <div className="mb-8">
          <label className="block text-[#69806C] text-lg font-['Iceland'] mb-2">
            Special Instructions (Optional)
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            maxLength={200}
            rows={3}
            className="w-full p-3 border-2 border-gray-300 rounded-lg font-['Iceland']"
            placeholder="Any special requests..."
          />
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h3 className="text-2xl text-[#69806C] font-['Iceland'] mb-4">Order Summary</h3>
          <div className="space-y-2 text-lg font-['Iceland']">
            <p>Cup Size: <span className="font-bold">{cupSize}</span></p>
            <p>Flavor: <span className="font-bold">{selectedFlavor?.name || 'Not selected'}</span></p>
            <p>Toppings: <span className="font-bold">
              {selectedToppings.length > 0 ? selectedToppings.map(t => t.name).join(', ') : 'None'}
            </span></p>
            <div className="border-t pt-2 mt-2">
              <p className="text-2xl text-[#69806C] font-bold">Total: ฿{calculateTotal()}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/home">
            <button className="px-6 py-3 bg-gray-400 text-white text-xl font-['Iceland'] rounded-lg hover:bg-gray-500 transition">
              Cancel
            </button>
          </Link>
          <button
            onClick={handleCreateOrder}
            disabled={loading || !selectedFlavor}
            className="px-8 py-3 bg-[#69806C] text-white text-xl font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Order...' : 'Confirm Order'}
          </button>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h2 className="text-3xl text-green-600 mb-4 text-center">✅ สั่งซื้อสำเร็จ!</h2>
            <div className="bg-gray-100 p-4 rounded mb-4">
              <p className="text-sm text-gray-600 text-center">รหัสรับสินค้า:</p>
              <p className="text-4xl font-bold text-[#69806C] text-center">{customerCode}</p>
            </div>
            <p className="text-sm mb-4 text-center">
              ⚠️ กรุณาจดจำหรือถ่ายรูปรหัสนี้เพื่อรับสินค้าและชำระเงินที่หน้าร้าน
            </p>
            {!localStorage.getItem('token') && (
              <p className="text-sm text-orange-600 mb-4 text-center">
                💰 คุณได้รับแต้มสะสม! สมัครสมาชิกเพื่อรักษาแต้มของคุณ
              </p>
            )}
            <button
              onClick={() => router.push(`/order/track?code=${customerCode}`)}
              className="w-full bg-[#69806C] text-white py-3 rounded font-['Iceland'] text-lg hover:bg-[#5a6e5e] transition"
            >
              ติดตามสถานะออเดอร์
            </button>
          </div>
        </div>
      )}
    </div>
  );
}