import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../components/common/Navbar';
import HeroSection from '../components/common/HeroSection';
import Footer from "../../components/common/Footer";
import OrderSuccessCard from '../components/order/OrderSuccessCard';
import { orderAPI } from '../../services/api';
import toast from 'react-hot-toast';

const CLAIM_WINDOW_SECONDS = 10;

const OrderSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { orderId, orderNumber } = location.state || {};
  const [countdown, setCountdown] = useState(orderId ? CLAIM_WINDOW_SECONDS : null);
  const [confirmed, setConfirmed] = useState(false);
  const [voided, setVoided] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const countdownRef = useRef(null);

  // Ensure limits (alreadyOrdered) are refetched when user leaves for product/cart so item stays disabled
  useEffect(() => {
    try {
      sessionStorage.setItem("limitsNeedRefresh", "1");
    } catch (_) {}
  }, []);

  // 10-second countdown: if not confirmed in time, order is auto-voided by backend
  useEffect(() => {
    if (!orderId || confirmed || voided) return;
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev == null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          setVoided(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [orderId, confirmed, voided]);

  const handleConfirmOrder = async () => {
    if (!orderId || confirming || confirmed) return;
    setConfirming(true);
    try {
      await orderAPI.confirmOrder(orderId);
      setConfirmed(true);
      if (countdownRef.current) clearInterval(countdownRef.current);
      toast.success('Order confirmed! It will not be voided.');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to confirm order');
    } finally {
      setConfirming(false);
    }
  };

  // Extract user's first name from user data
  const getUserName = () => {
    if (user?.displayName) {
      // If displayName exists, use the first part (first name)
      return user.displayName.split(' ')[0];
    }
    if (user?.email) {
      // Fallback to email username
      return user.email.split('@')[0];
    }
    return 'Student';
  };

  const handleOrderAgain = () => {
    navigate('/all-products');
  };

  const handleBackHome = () => {
    navigate('/all-products');
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Main Content - Overlapping Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 pb-12 -mt-16">
        {/* Success Card Container with Background */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden relative min-h-[600px] md:min-h-[700px]">
          {/* Back to Home Button - Top Left Corner */}
          <button 
            className="absolute top-6 left-6 px-5 py-2.5 bg-[#0C2340] text-white border-none rounded-lg font-semibold text-sm cursor-pointer transition-all duration-300 shadow-[0_2px_8px_rgba(12,35,64,0.2)] hover:bg-[#003363] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(12,35,64,0.3)] active:translate-y-0 z-50"
            onClick={handleBackHome}
          >
            Back to Home
          </button>

          {/* Watermark Text - Behind everything */}
          <div className="absolute bottom-44 left-1/3 -translate-x-1/2 text-[4rem] md:text-[6rem] lg:text-[8rem] font-black text-[rgba(255, 255, 255, 0.15)] whitespace-nowrap z-0 select-none pointer-events-none leading-[0.9]">
            Order <br /> Successfull
          </div>

          {/* Background Image - Full card coverage */}
          <div className="absolute inset-0 z-10">
            <img
              src="/assets/image/LandingPage.png"
              alt="La Verdad Campus"
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Gradient Overlay - Over entire card */}
          <div className="absolute inset-0 z-20" style={{
            background: 'linear-gradient(180deg, rgba(243,243,243,0.16) 0%, rgba(242,196,127,0.59) 16%, rgba(64,102,138,0.77) 59%, rgba(1,109,211,1) 100%)'
          }}></div>

          {/* Content - On top of gradient */}
          <div className="relative z-30 flex flex-col items-center justify-center min-h-[600px] md:min-h-[700px] gap-6">
            {orderId && !confirmed && !voided && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl px-6 py-4 text-center shadow-lg">
                <p className="text-amber-900 font-semibold mb-2">
                  Confirm your order within {countdown ?? CLAIM_WINDOW_SECONDS} seconds or it will be voided
                </p>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={confirming || (countdown !== null && countdown <= 0)}
                  className="px-6 py-2.5 bg-[#F28C28] text-white font-bold rounded-lg hover:bg-[#d97a1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {confirming ? 'Confirming…' : 'Confirm order'}
                </button>
              </div>
            )}
            {orderId && confirmed && (
              <p className="text-green-700 font-semibold bg-green-50 px-4 py-2 rounded-lg">
                Order confirmed. It will not be voided.
              </p>
            )}
            {orderId && voided && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-6 py-4 text-center">
                <p className="text-red-800 font-semibold">
                  Order was voided because it was not confirmed in time. You cannot place another order.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/student/profile', { state: { activeTab: 'orders' } })}
                  className="mt-3 px-4 py-2 bg-[#003363] text-white rounded-lg hover:bg-[#0C2340]"
                >
                  View orders
                </button>
              </div>
            )}
            <OrderSuccessCard 
              userName={getUserName()}
              onOrderAgain={voided ? () => navigate('/student/profile') : handleOrderAgain}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
