import React from 'react';
import { Check } from 'lucide-react';

const SuccessIcon = ({ className = '' }) => {
  return (
    <div className={`w-20 h-20 bg-blue-300 rounded-full flex items-center justify-center mx-auto mb-6 animate-scaleIn ${className}`}>
      <Check className="text-white" size={48} strokeWidth={3} />
    </div>
  );
};

export default SuccessIcon;
