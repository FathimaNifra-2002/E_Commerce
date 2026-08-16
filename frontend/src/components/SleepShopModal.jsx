import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const SleepShopModal = ({ isOpen, onClose, orderData }) => {
  const { backendUrl, token, setCartItems } = useContext(ShopContext);
  const navigate = useNavigate();

  const [triggerCondition, setTriggerCondition] = useState('timer'); // 'timer' | 'midnight_flash_sale' | 'price_drop' | 'restock'
  const [delayHours, setDelayHours] = useState(12);
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !orderData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please login to schedule a Sleep & Shop order.");
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...orderData,
        triggerCondition,
        delayHours: Number(delayHours),
        triggerValue: triggerCondition === 'price_drop' ? targetPrice : null
      };

      const response = await axios.post(
        backendUrl + '/api/deferred-order/create',
        payload,
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success("🌙 Order saved to Sleep & Shop Vault!");
        setCartItems({});
        onClose();
        navigate('/sleep-shop-vault');
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs'>
      <div className='bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-gray-100 max-h-[92vh] overflow-y-auto'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-lg w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition'
        >
          ✕
        </button>

        <div className='flex items-center gap-2 mb-2'>
          <span className='text-2xl'>🌙</span>
          <h2 className='text-lg font-black text-gray-900'>Sleep & Shop — Deferred Purchase Mode</h2>
        </div>
        <p className='text-xs text-gray-600 mb-5 leading-relaxed'>
          Need time to "sleep on it" or want to catch flash discounts? Save this purchase to auto-process at your chosen time. You can cancel or buy immediately anytime before execution with zero penalty.
        </p>

        {/* Condition Options */}
        <div className='flex flex-col gap-2.5 mb-5'>
          <label className='block text-xs font-bold text-gray-800 uppercase tracking-wider'>
            Choose Execution Trigger:
          </label>

          {/* Option 1: Sleep on it Timer */}
          <div
            onClick={() => setTriggerCondition('timer')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              triggerCondition === 'timer'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className='text-2xl'>🛌</span>
            <div className='flex-1'>
              <div className='flex justify-between items-center'>
                <h4 className='text-xs font-bold text-gray-900'>Cooldown Timer ("Slept On It")</h4>
                {triggerCondition === 'timer' && (
                  <span className='text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full'>
                    Active
                  </span>
                )}
              </div>
              <p className='text-[11px] text-gray-500 mt-0.5'>
                Gives you time to sleep on your purchase. Reduces impulse regret & returns.
              </p>

              {triggerCondition === 'timer' && (
                <div className='flex gap-2 mt-3 pt-2 border-t border-indigo-100'>
                  {[
                    { h: 6, label: '6 Hours' },
                    { h: 12, label: '12 Hours (Recommended)' },
                    { h: 24, label: '24 Hours' }
                  ].map((t) => (
                    <button
                      key={t.h}
                      type='button'
                      onClick={(e) => { e.stopPropagation(); setDelayHours(t.h); }}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                        delayHours === t.h
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Option 2: Midnight Flash Sale */}
          <div
            onClick={() => setTriggerCondition('midnight_flash_sale')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              triggerCondition === 'midnight_flash_sale'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className='text-2xl'>⚡</span>
            <div className='flex-1'>
              <div className='flex justify-between items-center'>
                <h4 className='text-xs font-bold text-gray-900'>Midnight Flash Sale Trigger (12:00 AM)</h4>
                {triggerCondition === 'midnight_flash_sale' && (
                  <span className='text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full'>
                    Active
                  </span>
                )}
              </div>
              <p className='text-[11px] text-gray-500 mt-0.5'>
                Auto-executes at midnight when flash sale discounts and coupons go live!
              </p>
            </div>
          </div>

          {/* Option 3: Price Drop Trigger */}
          <div
            onClick={() => setTriggerCondition('price_drop')}
            className={`p-3.5 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
              triggerCondition === 'price_drop'
                ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <span className='text-2xl'>📉</span>
            <div className='flex-1'>
              <div className='flex justify-between items-center'>
                <h4 className='text-xs font-bold text-gray-900'>Target Price Drop Auto-Buy</h4>
                {triggerCondition === 'price_drop' && (
                  <span className='text-[10px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full'>
                    Active
                  </span>
                )}
              </div>
              <p className='text-[11px] text-gray-500 mt-0.5'>
                Auto-orders if price drops to your target amount within 7 days.
              </p>

              {triggerCondition === 'price_drop' && (
                <div className='mt-2 pt-2 border-t border-indigo-100 flex items-center gap-2'>
                  <input
                    type='number'
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder={`Target total (e.g. ${Math.round(orderData.amount * 0.85)})`}
                    className='border border-gray-300 rounded p-1.5 text-xs bg-white w-full'
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className='p-3.5 bg-gray-50 rounded-xl border border-gray-200 mb-5 flex justify-between items-center text-xs'>
          <div>
            <span className='text-gray-500'>Order Total:</span>
            <p className='font-bold text-gray-900 text-sm'>${orderData.amount} ({orderData.items?.length || 0} items)</p>
          </div>
          <div className='text-right'>
            <span className='text-gray-500'>Payment Method:</span>
            <p className='font-bold text-gray-900 uppercase'>{orderData.paymentMethod || 'Cash on Delivery'}</p>
          </div>
        </div>

        {/* Buttons */}
        <div className='flex gap-3'>
          <button
            type='button'
            onClick={onClose}
            className='flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl text-xs font-semibold hover:bg-gray-50 transition'
          >
            Go Back
          </button>
          <button
            type='button'
            disabled={loading}
            onClick={handleSubmit}
            className='flex-1 bg-black text-white py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition shadow-md flex items-center justify-center gap-2 cursor-pointer'
          >
            <span>🌙</span>
            <span>{loading ? "Scheduling..." : "Confirm & Save in Vault"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SleepShopModal;
