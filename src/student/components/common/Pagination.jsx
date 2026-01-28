import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  onPrevious,
  onNext,
  canGoPrev,
  canGoNext,
}) => {
  return (
    <div className="flex items-center justify-end space-x-2 mt-8 mb-4">
      {/* Previous Button */}
      <button
        onClick={onPrevious}
        disabled={!canGoPrev}
        className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
          canGoPrev
            ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Next Button */}
      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex items-center space-x-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
          canGoNext
            ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Pagination;

