import React, { useState, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const BackInStockModal = ({ isOpen, onClose, product, initialSize = '' }) => {
  const { backendUrl, token } = useContext(ShopContext);
  const [email, setEmail] = useState('');
  const [size, setSize] = useState(initialSize || (product?.sizes && product?.sizes[0]) || 'M');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        backendUrl + '/api/stock-alert/subscribe',
        {
          email,
          productId: product._id,
          size
        },
        token ? { headers: { token } } : {}
      );

      if (response.data.success) {
        toast.success(response.data.message || "Restock notification registered!");
        onClose();
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
    <div className='fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs'>
      <div className='bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-gray-100'>
        <button
          onClick={onClose}
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-lg w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition'
        >
          ✕
        </button>

        <div className='flex items-center gap-2 mb-2'>
          <span className='text-2xl'>🔔</span>
          <h2 className='text-lg font-bold text-gray-900'>Back in Stock Alert</h2>
        </div>
        <p className='text-xs text-gray-500 mb-4'>
          Be the first to know the moment <strong>{product.name}</strong> is back in our warehouse. We will send you an instant email & notification!
        </p>

        <div className='flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4'>
          <img src={product.image[0]} alt={product.name} className='w-14 h-16 object-cover rounded-lg' />
          <div>
            <h4 className='text-xs font-bold text-gray-800 line-clamp-1'>{product.name}</h4>
            <p className='text-xs text-gray-600 mt-0.5'>${product.price}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
          <div>
            <label className='block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1'>
              Select Preferred Size
            </label>
            <div className='flex flex-wrap gap-1.5'>
              {(product.sizes || ['S', 'M', 'L', 'XL']).map((sz) => (
                <button
                  key={sz}
                  type='button'
                  onClick={() => setSize(sz)}
                  className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition ${
                    size === sz
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  Size {sz}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className='block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1'>
              Your Email Address
            </label>
            <input
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='e.g. name@example.com'
              className='w-full border border-gray-300 rounded-lg p-2.5 text-xs font-medium bg-white outline-none focus:border-black'
            />
          </div>

          <div className='mt-2 flex gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition'
            >
              Cancel
            </button>
            <button
              type='submit'
              disabled={loading}
              className='flex-1 bg-black text-white py-2.5 rounded-lg text-xs font-bold hover:bg-gray-800 transition shadow-md'
            >
              {loading ? "Subscribing..." : "Notify Me On Restock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BackInStockModal;
