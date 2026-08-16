import React, { useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import { toast } from 'react-toastify';

const CompleteTheLook = ({ currentProduct, title = "Complete The Look", subtitle = "Pair with these matching essentials and get an instant 15% bundle discount!" }) => {
  const { products, currency, addToCart } = useContext(ShopContext);

  if (!currentProduct || !products || products.length === 0) return null;

  // Filter complementary items
  const matchingItems = products.filter((p) => {
    if (p._id === currentProduct._id) return false;
    // If current is Topwear, find Bottomwear or Outerwear
    if (currentProduct.subCategory === 'Topwear') {
      return p.subCategory === 'Bottomwear' || p.subCategory === 'Winterwear';
    }
    // If current is Bottomwear, find Topwear
    if (currentProduct.subCategory === 'Bottomwear') {
      return p.subCategory === 'Topwear' || p.subCategory === 'Winterwear';
    }
    // If winterwear or other, find different subcategory
    return p.category === currentProduct.category && p.subCategory !== currentProduct.subCategory;
  }).slice(0, 2);

  if (matchingItems.length === 0) return null;

  const bundleItems = [currentProduct, ...matchingItems];
  const originalTotalPrice = bundleItems.reduce((acc, curr) => acc + curr.price, 0);
  const bundleDiscountPercent = 15;
  const discountedTotalPrice = Math.round(originalTotalPrice * (1 - bundleDiscountPercent / 100));
  const savings = originalTotalPrice - discountedTotalPrice;

  const handleAddBundleToCart = async () => {
    for (const item of bundleItems) {
      const defaultSize = item.sizes && item.sizes.length > 0 ? item.sizes[0] : 'M';
      await addToCart(item._id, defaultSize);
    }
    toast.success(`🎉 Entire Look added to Cart with 15% Bundle Discount applied! (Saved ${currency}${savings})`);
  };

  return (
    <div className='my-10 p-5 rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-orange-50/20 to-gray-50 shadow-sm'>
      {/* Header */}
      <div className='flex flex-wrap justify-between items-center gap-2 mb-4 pb-3 border-b border-gray-200'>
        <div>
          <h3 className='text-base font-bold text-gray-900 flex items-center gap-2'>
            <span>✨</span> {title}
            <span className='bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full'>
              Bundle & Save 15%
            </span>
          </h3>
          <p className='text-xs text-gray-500 mt-0.5'>{subtitle}</p>
        </div>

        <div className='text-right'>
          <div className='flex items-baseline gap-2 justify-end'>
            <span className='text-xs line-through text-gray-400 font-semibold'>{currency}{originalTotalPrice}</span>
            <span className='text-base font-black text-gray-900'>{currency}{discountedTotalPrice}</span>
          </div>
          <span className='text-[10px] font-bold text-green-600'>You Save {currency}{savings} (15% OFF)</span>
        </div>
      </div>

      {/* Items Preview */}
      <div className='flex flex-col sm:flex-row items-center gap-4 my-4'>
        <div className='flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 w-full'>
          {bundleItems.map((item, idx) => (
            <div key={item._id} className='relative flex flex-col items-center bg-white p-3 rounded-xl border border-gray-100 shadow-2xs group'>
              {idx === 0 ? (
                <span className='absolute top-2 left-2 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded'>
                  This Item
                </span>
              ) : (
                <span className='absolute top-2 left-2 bg-orange-100 text-orange-800 text-[9px] font-bold px-1.5 py-0.5 rounded'>
                  Match #{idx}
                </span>
              )}
              <img
                src={item.image[0]}
                alt={item.name}
                className='w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-lg mb-2 group-hover:scale-105 transition-transform'
              />
              <p className='text-xs font-semibold text-gray-800 text-center line-clamp-1'>{item.name}</p>
              <p className='text-xs font-bold text-gray-900 mt-1'>{currency}{item.price}</p>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div className='w-full sm:w-64 flex flex-col gap-2'>
          <button
            type='button'
            onClick={handleAddBundleToCart}
            className='w-full bg-black hover:bg-gray-800 text-white text-xs font-bold py-3.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer'
          >
            <span>🛍️</span>
            <span>Add Complete Look ({currency}{discountedTotalPrice})</span>
          </button>
          <p className='text-[10px] text-center text-gray-500'>
            Includes {bundleItems.length} items with instant 15% discount
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteTheLook;
