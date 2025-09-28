// src/pages/cart/index.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Updated menu data - removed Milk, Green Tea, Banana, Mango
const shavedIceFlavors = [
  { name: 'Strawberry', price: 60, image: '/images/strawberry-ice.png' },
  { name: 'Thai Tea', price: 60, image: '/images/thai-tea-ice.png' },
  { name: 'Matcha', price: 60, image: '/images/matcha-ice.png' },
];

const toppings = [
  { name: 'Apple', price: 10, image: '/images/apple.png' },
  { name: 'Cherry', price: 10, image: '/images/cherry.png' },
  { name: 'Blueberry', price: 10, image: '/images/blueberry.png' },
  { name: 'Raspberry', price: 10, image: '/images/raspberry.png' },
  { name: 'Strawberry', price: 10, image: '/images/strawberry.png' },
];

interface CartItem {
  id: string;
  cupSize: 'S' | 'M' | 'L';
  shavedIce: {
    flavor: string;
    price: number;
  };
  toppings: Array<{
    name: string;
    price: number;
  }>;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

export default function CartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedFlavor, setSelectedFlavor] = useState('');
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('M');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('bingsuCart');
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
  }, []);

  const saveCart = (items: CartItem[]) => {
    localStorage.setItem('bingsuCart', JSON.stringify(items));
    setCartItems(items);
  };

  const calculateItemPrice = (item: CartItem) => {
    const basePrice = item.shavedIce?.price || 60;
    const sizePrice = { S: 0, M: 10, L: 20 };
    const sizeCost = sizePrice[item.cupSize] || 0;
    const toppingsCost = (item.toppings?.length || 0) * 10;
    const unitPrice = basePrice + sizeCost + toppingsCost;
    return unitPrice * (item.quantity || 1);
  };

  const addToCart = () => {
    if (!selectedFlavor) {
      alert('Please select a flavor');
      return;
    }

    const flavor = shavedIceFlavors.find(f => f.name === selectedFlavor);
    const selectedToppingsData = toppings.filter(t => selectedToppings.includes(t.name));

    const newItem: CartItem = {
      id: Date.now().toString(),
      cupSize: selectedSize,
      shavedIce: {
        flavor: selectedFlavor,
        price: flavor?.price || 60
      },
      toppings: selectedToppingsData.map(t => ({
        name: t.name,
        price: t.price
      })),
      quantity: 1,
      price: 0, // Will be calculated below
      specialInstructions
    };

    // Calculate price properly
    const basePrice = newItem.shavedIce.price;
    const sizePrice = { S: 0, M: 10, L: 20 };
    const sizeCost = sizePrice[newItem.cupSize];
    const toppingsCost = newItem.toppings.length * 10;
    newItem.price = basePrice + sizeCost + toppingsCost;

    saveCart([...cartItems, newItem]);
    
    // Reset form
    setShowAddItem(false);
    setSelectedFlavor('');
    setSelectedSize('M');
    setSelectedToppings([]);
    setSpecialInstructions('');
  };

  const updateQuantity = (id: string, change: number) => {
    const updated = cartItems.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    saveCart(updated);
  };

  const removeItem = (id: string) => {
    const updated = cartItems.filter(item => item.id !== id);
    saveCart(updated);
  };

  const clearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      localStorage.removeItem('bingsuCart');
      setCartItems([]);
    }
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      const itemTotal = calculateItemPrice(item);
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }
    
    // Navigate to order page
    router.push('/order');
  };

  const toggleTopping = (toppingName: string) => {
    if (selectedToppings.includes(toppingName)) {
      setSelectedToppings(selectedToppings.filter(t => t !== toppingName));
    } else {
      if (selectedToppings.length >= 3) {
        alert('Maximum 3 toppings allowed');
        return;
      }
      setSelectedToppings([...selectedToppings, toppingName]);
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
        <h1 className="ml-6 text-white text-3xl font-['Iceland']">Shopping Cart</h1>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Add Item Form */}
        {showAddItem && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl text-[#69806C] font-['Iceland'] mb-6">Create Your Bingsu</h2>
            
            {/* Size Selection */}
            <div className="mb-6">
              <h3 className="text-lg text-[#69806C] font-['Iceland'] mb-3">Select Size</h3>
              <div className="flex gap-4">
                {['S', 'M', 'L'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size as 'S' | 'M' | 'L')}
                    className={`px-6 py-3 rounded-lg border-2 font-['Iceland'] text-lg transition ${
                      selectedSize === size
                        ? 'border-[#69806C] bg-[#69806C] text-white'
                        : 'border-gray-300 hover:border-[#69806C]'
                    }`}
                  >
                    Size {size} {size === 'S' ? '(+฿0)' : size === 'M' ? '(+฿10)' : '(+฿20)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Flavor Selection */}
            <div className="mb-6">
              <h3 className="text-lg text-[#69806C] font-['Iceland'] mb-3">Select Flavor (Required)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {shavedIceFlavors.map((flavor) => (
                  <button
                    key={flavor.name}
                    onClick={() => setSelectedFlavor(flavor.name)}
                    className={`rounded-lg border-2 font-['Iceland'] transition overflow-hidden ${
                      selectedFlavor === flavor.name
                        ? 'border-[#69806C] ring-2 ring-[#69806C]'
                        : 'border-gray-300 hover:border-[#69806C]'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={flavor.image} 
                        alt={flavor.name}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-32 bg-gradient-to-br from-[#69806C]/20 to-[#947E5A]/20 flex items-center justify-center text-4xl">
                        🍧
                      </div>
                      {selectedFlavor === flavor.name && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-[#69806C] text-white rounded-full flex items-center justify-center text-sm">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-lg">{flavor.name}</div>
                      <div className="text-sm text-gray-600">฿{flavor.price}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings Selection */}
            <div className="mb-6">
              <h3 className="text-lg text-[#69806C] font-['Iceland'] mb-3">
                Select Toppings (Max 3) - ฿10 each
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {toppings.map((topping) => (
                  <button
                    key={topping.name}
                    onClick={() => toggleTopping(topping.name)}
                    className={`rounded-lg border-2 font-['Iceland'] transition overflow-hidden ${
                      selectedToppings.includes(topping.name)
                        ? 'border-[#69806C] ring-2 ring-[#69806C]'
                        : 'border-gray-300 hover:border-[#69806C]'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={topping.image} 
                        alt={topping.name}
                        className="w-full h-20 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className="hidden w-full h-20 bg-gradient-to-br from-[#69806C]/20 to-[#947E5A]/20 flex items-center justify-center text-2xl">
                        🍓
                      </div>
                      {selectedToppings.includes(topping.name) && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-[#69806C] text-white rounded-full flex items-center justify-center text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="p-2 text-sm">
                      {topping.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div className="mb-6">
              <label className="block text-[#69806C] font-['Iceland'] mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded font-['Iceland']"
                placeholder="Any special requests..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowAddItem(false);
                  setSelectedFlavor('');
                  setSelectedSize('M');
                  setSelectedToppings([]);
                  setSpecialInstructions('');
                }}
                className="px-6 py-2 border border-gray-300 text-gray-600 font-['Iceland'] rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={addToCart}
                disabled={!selectedFlavor}
                className="px-6 py-2 bg-[#69806C] text-white font-['Iceland'] rounded-lg hover:bg-[#5a6e5e] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Cart
              </button>
            </div>
          </div>
        )}

        {/* Cart Items */}
        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-3xl text-[#69806C] font-['Iceland'] mb-4">
              Your cart is empty
            </h2>
            <p className="text-gray-600 font-['Iceland'] mb-8">
              Add some delicious Bingsu to your cart!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl text-[#69806C] font-['Iceland']">
                    Cart Items ({cartItems.length})
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 font-['Iceland'] text-sm"
                  >
                    Clear Cart
                  </button>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="border-b pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4 flex-1">
                          {/* Product Image */}
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                            {(() => {
                              const flavor = shavedIceFlavors.find(f => f.name === item.shavedIce?.flavor);
                              return flavor ? (
                                <img 
                                  src={flavor.image} 
                                  alt={item.shavedIce?.flavor || 'Flavor'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                  }}
                                />
                              ) : null;
                            })()}
                            <div className="hidden w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-[#69806C]/20 to-[#947E5A]/20">
                              🍧
                            </div>
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="text-lg font-['Iceland'] text-[#543429] font-bold">
                              {item.shavedIce?.flavor || 'Unknown Flavor'} Bingsu - Size {item.cupSize}
                            </h3>
                            {item.toppings && item.toppings.length > 0 && (
                              <p className="text-sm text-gray-600 font-['Iceland'] mt-1">
                                Toppings: {item.toppings.map(t => t.name).join(', ')}
                              </p>
                            )}
                            {item.specialInstructions && (
                              <p className="text-sm text-gray-500 font-['Iceland'] mt-1 italic">
                                Note: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700 ml-4"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 font-bold"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-['Iceland']">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <p className="text-lg font-['Iceland'] text-[#69806C] font-bold">
                          ฿{calculateItemPrice(item)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
                <h3 className="text-xl text-[#69806C] font-['Iceland'] mb-4">
                  Order Summary
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between font-['Iceland']">
                    <span>Subtotal</span>
                    <span>฿{getSubtotal()}</span>
                  </div>
                  <div className="flex justify-between font-['Iceland'] text-sm text-gray-500">
                    <span>Service Fee</span>
                    <span>฿0</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-['Iceland'] text-xl font-bold text-[#69806C]">
                    <span>Total</span>
                    <span>฿{getSubtotal()}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={cartItems.length === 0}
                  className="w-full py-3 bg-[#69806C] text-white font-['Iceland'] text-lg rounded-lg hover:bg-[#5a6e5e] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Proceed to Checkout
                </button>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800 font-['Iceland']">
                    💡 You'll need a menu code to complete your order at checkout
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}