import React from 'react';
import SuccessIcon from '../common/SuccessIcon';

const OrderSuccessCard = ({ userName, onOrderAgain }) => {
  return (
    <div className="w-full p-8 md:p-12 lg:p-16">
      {/* Success Icon */}
      <div className="flex justify-center mb-8">
        <SuccessIcon />
      </div>
      
      {/* Success Message */}
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#0C2340] mb-4 leading-tight text-center">
        Thank you for ordering, <span className="text-[#F28C28]">{userName}</span>!
      </h1>
      
      {/* Description */}
      <p className="text-base md:text-lg text-slate-500 leading-relaxed mb-10 max-w-2xl mx-auto text-center text-white">
        Your order has been successfully processed. Please check your notifications for updates regarding your order status.
      </p>
      
      {/* SHOW QR Button */}
      <div className="flex justify-center">
        <button 
          className="px-10 py-3.5 bg-[#0C2340] text-white rounded-lg font-semibold text-base cursor-pointer transition-all duration-300 shadow-[0_4px_12px_rgba(12,35,64,0.2)] hover:bg-[#003363] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(12,35,64,0.3)] active:translate-y-0"
          onClick={onOrderAgain}
        >
          SHOW QR
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessCard;
