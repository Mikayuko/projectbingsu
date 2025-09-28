// src/pages/review/index.tsx

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/utils/api';
import HeaderExclude from '../../components/HeaderExclude';

interface CustomerReview {
  _id?: string;
  name: string;
  rating: number;
  text: string;
  date?: string;
}

export default function ReviewPage() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Try to fetch from API
      const result = await api.getReviews(1, 50);
      const formattedReviews = result.reviews.map((r: any) => ({
        _id: r._id,
        name: r.customerName || 'Anonymous',
        rating: r.rating,
        text: r.comment,
        date: new Date(r.createdAt).toLocaleDateString()
      }));
      setCustomerReviews(formattedReviews);
    } catch (error) {
      // If API fails, use default reviews
      console.log('Using default reviews');
      setCustomerReviews([
        { name: 'Alice', rating: 5, text: 'Best shaved ice ever! The mango flavor was amazing.', date: '2024-01-15' },
        { name: 'Bob', rating: 4, text: 'Great taste, loved the toppings!', date: '2024-01-14' },
        { name: 'Charlie', rating: 3, text: 'It was good, but the ice melted a bit too fast.', date: '2024-01-13' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (rating > 0 && review.trim() !== '') {
      try {
        // Submit to API
        await api.createReview({
          rating,
          comment: review,
        });
        
        setSubmitted(true);
        
        // Add to local list immediately
        const newReview: CustomerReview = {
          name: 'You',
          rating,
          text: review,
          date: new Date().toLocaleDateString()
        };
        setCustomerReviews([newReview, ...customerReviews]);
        
        // Reset form after 2 seconds
        setTimeout(() => {
          setSubmitted(false);
          setRating(0);
          setReview('');
        }, 2000);
      } catch (error) {
        console.error('Failed to submit review:', error);
        // Still show as submitted even if API fails
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
        }, 2000);
      }
    }
  };

  const averageRating = customerReviews.length > 0
    ? customerReviews.reduce((sum, r) => sum + r.rating, 0) / customerReviews.length
    : 0;

  return (
    <div className="relative w-full min-h-screen bg-[#EBE6DE] px-4 md:px-10 lg:px-20 py-10">
      <HeaderExclude />

      {/* Section Title */}
      <div className="relative w-full mb-8 mt-4">
        <div className="absolute top-6 left-0 w-[280px] h-24 bg-[#EBE6DE] border-4 border-white shadow-[0_0_10px_rgba(0,0,0,0.25),_0_10px_30px_rgba(0,0,0,0.25)] rounded-r-[30px] flex items-center pl-6">
          <h2 className="text-white text-[32px] sm:text-[40px] md:text-[48px] font-['Iceland'] leading-none drop-shadow-md">
            Review page
          </h2>
        </div>
      </div>

      {/* Review Content */}
      <div className="w-full py-10 flex flex-col items-center">
        <h1 className="text-[48px] text-[#69806C] font-['Iceland'] mb-6 drop-shadow">
          Review
        </h1>

        {/* Current Rating */}
        <div className="mb-6 text-center text-[#543429] text-xl font-['Iceland']">
          Current Rating:{' '}
          <span className="text-yellow-500 text-3xl">
            {averageRating.toFixed(1)} ★
          </span>
        </div>

        {/* Review Form */}
        {!submitted ? (
          <div className="bg-white/80 border border-[#69806C] rounded-xl shadow-xl p-6 w-full max-w-xl flex flex-col items-center gap-6">
            {/* ⭐️ Rating Selector */}
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setRating(num)}
                  className={`text-4xl ${
                    rating >= num ? 'text-yellow-400' : 'text-gray-400'
                  } hover:scale-110 transition`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* ✍️ Textarea */}
            <textarea
              placeholder="Write your review here..."
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={5}
              className="w-full p-4 border border-[#69806C] rounded-md text-[#543429] font-['Iceland'] placeholder:text-[#A3A3A3] resize-none focus:outline-none shadow-inner"
            />

            {/* ✅ Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || review.trim() === ''}
              className="w-48 h-14 bg-[#69806C] text-white text-2xl font-['Iceland'] rounded-lg shadow-md hover:bg-[#506256] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Review
            </button>
          </div>
        ) : (
          <div className="text-center mt-20 text-[#69806C] text-2xl font-['Iceland']">
            Thank you for your review! 💖
          </div>
        )}

        {/* 👥 Customer Reviews - ย้ายมาอยู่ข้างล่าง */}
        <div className="w-full max-w-4xl mx-auto mt-12 mb-20">
          <h2 className="text-3xl text-[#69806C] font-['Iceland'] mb-6">Customer Reviews</h2>
          <div className="flex flex-col gap-4">
            {loading ? (
              <p className="text-center text-gray-500 font-['Iceland']">Loading reviews...</p>
            ) : customerReviews.length === 0 ? (
              <p className="text-center text-gray-500 font-['Iceland']">No reviews yet. Be the first!</p>
            ) : (
              customerReviews.map((r, i) => (
                <div
                  key={r._id || i}
                  className="bg-white border border-[#69806C] rounded-lg p-4 shadow-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-['Iceland'] text-[#543429]">{r.name}</span>
                    <span className="text-yellow-400 text-xl">
                      {'★'.repeat(r.rating)}
                      {'☆'.repeat(5 - r.rating)}
                    </span>
                  </div>
                  <p className="text-[#543429] font-['Iceland'] text-base">{r.text}</p>
                  {r.date && (
                    <p className="text-sm text-gray-500 font-['Iceland'] mt-2">{r.date}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}