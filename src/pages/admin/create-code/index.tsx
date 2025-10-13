// src/pages/admin/create-code/index.tsx - Fixed: Authentication

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated, isAdmin, api, getCurrentUser } from '@/utils/api';

export default function CreateCodePage() {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = () => {
    // ✅ ตรวจสอบ authentication
    if (!isAuthenticated()) {
      alert('Please login to access Admin');
      router.push('/login');
      return;
    }

    // ✅ ตรวจสอบว่าเป็น admin
    if (!isAdmin()) {
      alert('Admin access only');
      router.push('/home');
      return;
    }

    // ✅ ตรวจสอบว่ามี token ใน localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Authentication token not found. Please login again.');
      router.push('/login');
      return;
    }

    const user = getCurrentUser();
    console.log('✅ Authenticated as:', user);
    
    setCheckingAuth(false);
  };

  const handleConfirm = async () => {
    if (!selectedSize) {
      setError('Please select a cup size');
      return;
    }

    // ✅ ตรวจสอบอีกครั้งก่อนส่ง request
    if (!isAuthenticated() || !isAdmin()) {
      alert('Authentication required. Please login again.');
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('📝 Generating menu code for size:', selectedSize);
      console.log('🔑 Token exists:', !!localStorage.getItem('token'));
      
      const result = await api.generateMenuCode(selectedSize);
      
      console.log('✅ Code generated successfully:', result);
      
      setGeneratedCode(result.code);
      setExpiresAt(new Date(result.expiresAt));
      
    } catch (err: any) {
      console.error('❌ Code generation error:', err);
      
      // ✅ จัดการ error ตามประเภท
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        setError('Authentication failed. Please login again.');
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        
      } else if (err.message.includes('403') || err.message.includes('Forbidden')) {
        setError('Access denied. Admin privileges required.');
        
      } else if (err.message.includes('Failed to generate unique code')) {
        setError('Unable to generate unique code. Please try again.');
        
      } else {
        setError(err.message || 'Failed to generate code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedSize(null);
    setGeneratedCode(null);
    setError('');
    setExpiresAt(null);
  };

  // ✅ แสดง loading ขณะตรวจสอบ auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#EBE6DE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#69806C] mx-auto mb-4"></div>
          <p className="text-2xl text-[#69806C] font-['Iceland']">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center">
      {/* Header */}
      <div className="w-full h-[60px] bg-[#69806C] flex items-center px-10 shadow-lg">
        <Link href="/admin">
          <div className="w-12 h-12 bg-[#69806C] rounded-full flex items-center justify-center">
            <span className="text-white text-2xl cursor-pointer hover:bg-white/20 transition px-3 rounded-full">{'<'}</span>
          </div>
        </Link>
      </div>
      
      <h1 className="text-4xl text-[#69806C] mb-10 mt-10 drop-shadow font-['Iceland']">
        Create Code for Bingsu
      </h1>

      

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded font-['Iceland'] max-w-xl mx-4">
          {error}
        </div>
      )}

      {/* Cup Size Selector */}
      <div className="w-full max-w-3xl flex flex-col items-center mb-10 px-4">
        <h2 className="text-[40px] text-[#69806C] mb-6 font-['Iceland']"> Cup Size</h2>
        <div className="flex gap-6">
          {['S', 'M', 'L'].map((size) => (
            <button
              key={size}
              onClick={() => {
                setSelectedSize(size);
                setGeneratedCode(null);
                setError('');
              }}
              disabled={loading}
              className={`w-[100px] h-[100px] flex items-center justify-center rounded shadow-[0_0_20px_rgba(0,0,0,0.25),inset_0_10px_20px_rgba(0,0,0,0.25)] 
              ${selectedSize === size ? 'bg-[#69806C]' : 'bg-[#EBE6DE]'} 
              transition 
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:scale-105`}
            >
              <span
                className={`text-[96px] leading-none ${
                  selectedSize === size ? 'text-white' : 'text-[#543429]'
                }`}
              >
                {size}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      {selectedSize && !generatedCode && (
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="bg-[#69806C] text-white text-2xl px-10 py-3 rounded-xl shadow-md hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed font-['Iceland']"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Generating...
            </span>
          ) : (
            'Confirm & Generate Code'
          )}
        </button>
      )}

      {/* Display Generated Code */}
      {generatedCode && (
        <div className="mt-10 text-center max-w-2xl mx-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 mb-6">
            <h2 className="text-3xl text-[#543429] mb-4 font-['Iceland']">Menu Code Generated!</h2>
            
            <div className="bg-gradient-to-r from-[#69806C] to-[#947E5A] text-white text-6xl font-bold tracking-widest px-8 py-6 rounded-xl shadow-lg font-['Iceland'] mb-4">
              {generatedCode}
            </div>
            
            <div className="space-y-2 text-left bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 font-['Iceland']">
                <strong>Cup Size:</strong> <span className="text-[#69806C] text-xl">{selectedSize}</span>
              </p>
              {expiresAt && (
                <p className="text-sm text-gray-600 font-['Iceland']">
                  <strong>Expires:</strong> {expiresAt.toLocaleString('th-TH')}
                </p>
              )}
              <p className="text-sm text-blue-700 font-['Iceland'] mt-3 p-2 bg-blue-50 rounded">
                💡 <strong>This code will be used to track the order</strong>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleReset}
              className="bg-[#947E5A] text-white text-xl px-8 py-3 rounded-xl shadow-md hover:scale-105 transition font-['Iceland']"
            >
              Generate Another Code
            </button>
            
            <Link href="/admin/orders">
              <button className="bg-blue-500 text-white text-xl px-8 py-3 rounded-xl shadow-md hover:scale-105 transition font-['Iceland']">
                View Orders
              </button>
            </Link>
          </div>

          {/* Copy to Clipboard */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(generatedCode);
              alert('✅ Code copied to clipboard!');
            }}
            className="mt-4 text-gray-600 underline hover:text-[#69806C] font-['Iceland']"
          >
            📋 Copy Code to Clipboard
          </button>
        </div>
      )}

     
    </div>
  );
}