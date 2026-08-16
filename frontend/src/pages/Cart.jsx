import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';
import TrustBadges from '../components/TrustBadges';
import CompleteTheLook from '../components/CompleteTheLook';

const Cart = () => {

  const { products, currency, cartItems, updateQuantity, navigate, getCartAmount } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];
      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item]
            })
          }
        }
      }
      setCartData(tempData);
    }
  }, [cartItems, products])

  const firstProductInCart = cartData.length > 0 ? products.find(p => p._id === cartData[0]._id) : null;
  const cartAmount = getCartAmount();

  return (
    <div className='border-t pt-14'>

      <div className=' text-2xl mb-3'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>

      {/* Trust & Free Delivery Meter */}
      <TrustBadges currentAmount={cartAmount} freeShippingThreshold={100} currency={currency} />

      <div>
        {cartData.length === 0 ? (
          <div className='py-16 text-center text-gray-500'>
            <span className='text-4xl block mb-2'>🛒</span>
            <p className='text-sm font-semibold'>Your shopping cart is empty</p>
            <button
              onClick={() => navigate('/collection')}
              className='mt-4 bg-black text-white text-xs font-bold px-6 py-2.5 rounded-lg'
            >
              Explore Collection
            </button>
          </div>
        ) : (
          cartData.map((item, index) => {
            const productData = products.find((product) => product._id === item._id);
            if (!productData) return null;

            return (
              <div key={index} className='py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
                <div className=' flex items-start gap-6'>
                  <img className='w-16 sm:w-20 rounded-lg object-cover' src={productData.image[0]} alt="" />
                  <div>
                    <p className='text-xs sm:text-lg font-medium text-gray-900'>{productData.name}</p>
                    <div className='flex items-center gap-5 mt-2'>
                      <p className='font-bold text-black'>{currency}{productData.price}</p>
                      <p className='px-2 sm:px-3 sm:py-1 border rounded bg-slate-50 text-xs font-bold'>Size {item.size}</p>
                    </div>
                  </div>
                </div>
                <input onChange={(e) => e.target.value === '' || e.target.value === '0' ? null : updateQuantity(item._id, item.size, Number(e.target.value))} className='border rounded max-w-10 sm:max-w-20 px-1 sm:px-2 py-1 text-center font-bold' type="number" min={1} defaultValue={item.quantity} />
                <img onClick={() => updateQuantity(item._id, item.size, 0)} className='w-4 mr-4 sm:w-5 cursor-pointer hover:opacity-75 transition' src={assets.bin_icon} alt="" />
              </div>
            )
          })
        )}
      </div>

      {/* Complete The Look Upsell */}
      {firstProductInCart && (
        <CompleteTheLook
          currentProduct={firstProductInCart}
          title="Pair & Save — Complete Your Outfit"
          subtitle="Add matching accessories & bottoms to your cart and claim an instant 15% bundle discount!"
        />
      )}

      {cartData.length > 0 && (
        <div className='flex justify-end my-12'>
          <div className='w-full sm:w-[450px]'>
            <CartTotal />
            <div className=' w-full text-end'>
              <button onClick={() => navigate('/place-order')} className='bg-black text-white text-xs font-bold my-8 px-8 py-3.5 rounded-xl uppercase tracking-wider hover:bg-gray-800 transition shadow-md cursor-pointer'>
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Cart
