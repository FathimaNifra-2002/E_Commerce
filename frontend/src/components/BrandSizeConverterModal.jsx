import React, { useState } from 'react';

const BRAND_DATABASE = {
  "Zara": {
    cut: "European Slim",
    notes: "Zara tends to run slim in the shoulders and chest. We recommend sizing up if you like a relaxed fit.",
    conversion: {
      "XS": { size: "S", confidence: 92, note: "Zara XS is very snug; Forever S gives comfortable ease." },
      "S": { size: "S", confidence: 95, note: "True match for a slim modern fit." },
      "M": { size: "L", confidence: 94, note: "Zara M runs trim across chest; Forever L provides optimal comfort." },
      "L": { size: "L", confidence: 96, note: "Direct match with classic silhouette." },
      "XL": { size: "XL", confidence: 93, note: "Direct match with generous room." },
      "XXL": { size: "XXL", confidence: 95, note: "Direct match." }
    }
  },
  "H&M": {
    cut: "Regular Standard",
    notes: "H&M aligns very closely with international standard dimensions.",
    conversion: {
      "XS": { size: "S", confidence: 90, note: "Forever S fits closest to H&M XS." },
      "S": { size: "S", confidence: 98, note: "Direct 1:1 match." },
      "M": { size: "M", confidence: 98, note: "Direct 1:1 match." },
      "L": { size: "L", confidence: 97, note: "Direct 1:1 match." },
      "XL": { size: "XL", confidence: 98, note: "Direct 1:1 match." },
      "XXL": { size: "XXL", confidence: 95, note: "Direct 1:1 match." }
    }
  },
  "Levi's": {
    cut: "Classic American Denim",
    notes: "Levi's follows traditional waist and chest block proportions.",
    conversion: {
      "28": { size: "S", confidence: 96, note: "Waist 28-29 fits Size S." },
      "30": { size: "S", confidence: 94, note: "Waist 30 fits Size S or trim M." },
      "32": { size: "M", confidence: 98, note: "Waist 32 is a textbook Size M." },
      "34": { size: "L", confidence: 97, note: "Waist 34 matches Size L." },
      "36": { size: "XL", confidence: 96, note: "Waist 36 matches Size XL." },
      "38": { size: "XXL", confidence: 95, note: "Waist 38 matches Size XXL." },
      "S": { size: "S", confidence: 95, note: "Direct match." },
      "M": { size: "M", confidence: 96, note: "Direct match." },
      "L": { size: "L", confidence: 95, note: "Direct match." },
      "XL": { size: "XL", confidence: 96, note: "Direct match." }
    }
  },
  "Nike": {
    cut: "Athletic Broad",
    notes: "Nike cuts broader in the shoulders and chest for athletic mobility.",
    conversion: {
      "S": { size: "M", confidence: 93, note: "If you fill out Nike S shoulders, Forever M fits best." },
      "M": { size: "M", confidence: 97, note: "Textbook athletic chest match." },
      "L": { size: "L", confidence: 97, note: "Direct match." },
      "XL": { size: "XL", confidence: 96, note: "Direct match." },
      "XXL": { size: "XXL", confidence: 94, note: "Direct match." }
    }
  },
  "Adidas": {
    cut: "Relaxed Sportswear",
    notes: "Adidas tends to have a slightly relaxed, roomy drop.",
    conversion: {
      "S": { size: "S", confidence: 96, note: "Direct match." },
      "M": { size: "M", confidence: 97, note: "Direct match." },
      "L": { size: "L", confidence: 96, note: "Direct match." },
      "XL": { size: "XL", confidence: 95, note: "Direct match." }
    }
  },
  "Uniqlo": {
    cut: "Japanese Boxy & Relaxed",
    notes: "Uniqlo cuts slightly boxy with shorter torso lengths.",
    conversion: {
      "XS": { size: "S", confidence: 91, note: "Forever S matches chest with slightly longer hem." },
      "S": { size: "S", confidence: 97, note: "Direct match." },
      "M": { size: "M", confidence: 98, note: "Direct match." },
      "L": { size: "L", confidence: 97, note: "Direct match." },
      "XL": { size: "XL", confidence: 96, note: "Direct match." }
    }
  },
  "Mango": {
    cut: "European Tailored",
    notes: "Mango has tailored European sizing with trim sleeve cuts.",
    conversion: {
      "S": { size: "S", confidence: 94, note: "Direct fit." },
      "M": { size: "L", confidence: 92, note: "Forever L gives comfortable ease." },
      "L": { size: "L", confidence: 95, note: "Direct match." },
      "XL": { size: "XL", confidence: 94, note: "Direct match." }
    }
  },
  "GAP": {
    cut: "Relaxed American",
    notes: "GAP sizes run generous with plenty of ease.",
    conversion: {
      "S": { size: "M", confidence: 94, note: "GAP S has chest room equivalent to Forever M." },
      "M": { size: "L", confidence: 93, note: "GAP M fits like Forever L." },
      "L": { size: "XL", confidence: 92, note: "GAP L fits like Forever XL." },
      "XL": { size: "XXL", confidence: 90, note: "Forever XXL fits GAP XL ease." }
    }
  }
};

const BrandSizeConverterModal = ({ isOpen, onClose, onApplySize, availableSizes = [] }) => {
  const [selectedBrand, setSelectedBrand] = useState('Zara');
  const [category, setCategory] = useState('Tops & Shirts');
  const [brandSize, setBrandSize] = useState('M');

  if (!isOpen) return null;

  const brandInfo = BRAND_DATABASE[selectedBrand] || BRAND_DATABASE["Zara"];
  const recommendation = brandInfo.conversion[brandSize] || {
    size: brandSize,
    confidence: 90,
    note: `Standard proportional match for ${selectedBrand} ${brandSize}.`
  };

  const isAvailable = availableSizes.length === 0 || availableSizes.includes(recommendation.size);

  const handleApply = () => {
    onApplySize(recommendation.size);
    onClose();
  };

  return (
    <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs'>
      <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 max-h-[90vh] overflow-y-auto'>
        {/* Close Button */}
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-lg w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition'
        >
          ✕
        </button>

        {/* Title */}
        <div className='flex items-center gap-2 mb-2'>
          <span className='text-2xl'>👗</span>
          <h2 className='text-lg font-bold text-gray-900'>Cross-Brand Size Converter</h2>
        </div>
        <p className='text-xs text-gray-500 mb-6'>
          Tell us your usual size in any major brand, and our sizing engine will find your exact match in Forever.
        </p>

        {/* Step 1: Select Brand */}
        <div className='mb-4'>
          <label className='block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2'>
            1. Select Your Reference Brand
          </label>
          <div className='grid grid-cols-3 sm:grid-cols-4 gap-2'>
            {Object.keys(BRAND_DATABASE).map((brand) => (
              <button
                key={brand}
                type='button'
                onClick={() => setSelectedBrand(brand)}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition ${
                  selectedBrand === brand
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Select Category & Size */}
        <div className='grid grid-cols-2 gap-3 mb-6'>
          <div>
            <label className='block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2'>
              2. Garment Type
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className='w-full border border-gray-300 rounded-lg p-2 text-xs font-medium bg-white outline-none focus:border-black'
            >
              <option value='Tops & Shirts'>Tops & T-Shirts</option>
              <option value='Bottoms & Jeans'>Bottoms & Jeans</option>
              <option value='Jackets & Outerwear'>Jackets & Outerwear</option>
              <option value='Dresses'>Dresses</option>
            </select>
          </div>

          <div>
            <label className='block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2'>
              3. Your Size in {selectedBrand}
            </label>
            <div className='flex flex-wrap gap-1.5'>
              {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                <button
                  key={s}
                  type='button'
                  onClick={() => setBrandSize(s)}
                  className={`py-1.5 px-3 text-xs font-bold rounded border transition ${
                    brandSize === s
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* AI Result Card */}
        <div className='p-4 rounded-xl border border-orange-200 bg-orange-50/50 mb-6'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-xs font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1.5'>
              ✨ Forever Recommended Size
            </span>
            <span className='text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-orange-200 text-orange-900'>
              {recommendation.confidence}% Match Accuracy
            </span>
          </div>

          <div className='flex items-center gap-4 my-2'>
            <div className='w-14 h-14 rounded-xl bg-black text-white flex items-center justify-center text-2xl font-black shadow-md'>
              {recommendation.size}
            </div>
            <div>
              <p className='text-xs font-bold text-gray-900'>
                {selectedBrand} {brandSize} → <span className='text-orange-600'>Forever Size {recommendation.size}</span>
              </p>
              <p className='text-xs text-gray-600 mt-0.5'>{recommendation.note}</p>
            </div>
          </div>

          <div className='mt-3 pt-2.5 border-t border-orange-200 text-[11px] text-gray-600 flex items-center gap-2'>
            <span>💡</span>
            <span><strong>Brand Insight:</strong> {brandInfo.notes}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition'
          >
            Cancel
          </button>
          <button
            type='button'
            disabled={!isAvailable}
            onClick={handleApply}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-white transition ${
              isAvailable
                ? 'bg-black hover:bg-gray-800 shadow-md cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {isAvailable ? `Apply Size ${recommendation.size}` : `Size ${recommendation.size} (Out of stock)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandSizeConverterModal;
