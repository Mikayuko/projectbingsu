'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { isAuthenticated, isAdmin } from '@/utils/api';

const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

export default function CreateCodePage() {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const handleConfirm = () => {
    const newCode = generateRandomCode();
    setGeneratedCode(newCode);
    
    // Save code mapping to localStorage
    const codeMap = JSON.parse(localStorage.getItem('menuCodeMap') || '{}');
    codeMap[newCode] = selectedSize;
    localStorage.setItem('menuCodeMap', JSON.stringify(codeMap));
  };
  return (
          <div className="min-h-screen w-full bg-[#EBE6DE] flex flex-col items-center justify-start relative overflow-hidden">
        {/* Header */}
            <div className="w-full h-[60px] bg-[#69806C] flex items-center px-10 justify-between shadow-lg">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#69806C] rounded-full shadow-md flex items-center justify-center">
                <Link href="/admin">
                <span className="text-white text-2xl">{'<'}</span>
                </Link>
                </div>
            </div>
            </div>
            
      <h1 className="text-4xl text-[#69806C] mb-10 drop-shadow">Create Code for Bingsu</h1>

      {/* 🧊 Cup Size Selector */}
      <div className="w-full max-w-3xl flex flex-col items-center mb-10">
        <h2 className="text-[40px] text-[#69806C] mb-6">Cup Size</h2>
        <div className="flex gap-6">
          {['S', 'M', 'L'].map((size) => (
            <div key={size} className="flex flex-col items-center">
              <button
                onClick={() => {
                  setSelectedSize(size);
                  setGeneratedCode(null); // reset code when selecting new size
                }}
                className={`w-[100px] h-[100px] flex items-center justify-center rounded shadow-[0_0_20px_rgba(0,0,0,0.25),inset_0_10px_20px_rgba(0,0,0,0.25)] 
                ${selectedSize === size ? 'bg-[#69806C]' : 'bg-[#EBE6DE]'} transition`}
              >
                <span
                  className={`text-[96px] leading-none ${
                    selectedSize === size ? 'text-white' : 'text-[#543429]'
                  }`}
                >
                  {size}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Button */}
      {selectedSize && !generatedCode && (
        <button
          onClick={handleConfirm}
          className="bg-[#69806C] text-white text-2xl px-10 py-3 rounded-xl shadow-md hover:scale-105 transition"
        >
          ยืนยัน
        </button>
      )}

      {/* Display Generated Code */}
      {generatedCode && (
        <div className="mt-10 text-center">
          <h2 className="text-3xl text-[#543429] mb-4">รหัสสำหรับลูกค้า:</h2>
          <div className="text-5xl text-[#947E5A] font-bold tracking-widest bg-white px-6 py-4 rounded-xl shadow-lg">
            {generatedCode}
          </div>
        </div>
      )}
    </div>
  );
}
