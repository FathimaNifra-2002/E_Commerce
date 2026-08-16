import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext'
import Title from '../components/Title';
import axios from 'axios';

// Helper to safely extract a valid image URL from any format
export const getSafeImageUrl = (item, products = []) => {
  if (!item) return '';

  const cleanUrl = (val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    // If it's a JSON array string like '["https://..."]'
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanUrl(parsed[0]);
        }
        if (typeof parsed === 'string') return cleanUrl(parsed);
      } catch (e) {}
    }
    // Clean any quotes
    return trimmed.replace(/^["']|["']$/g, '');
  };

  // 1. Check item.image
  if (item.image) {
    if (Array.isArray(item.image) && item.image.length > 0) {
      const resolved = cleanUrl(item.image[0]);
      if (resolved) return resolved;
    } else if (typeof item.image === 'string') {
      const resolved = cleanUrl(item.image);
      if (resolved) return resolved;
    }
  }

  // 2. Check item.images
  if (item.images) {
    if (Array.isArray(item.images) && item.images.length > 0) {
      const resolved = cleanUrl(item.images[0]);
      if (resolved) return resolved;
    } else if (typeof item.images === 'string') {
      const resolved = cleanUrl(item.images);
      if (resolved) return resolved;
    }
  }

  // 3. Fallback: match from global products list in context
  if (products && products.length > 0) {
    const matched = products.find(p => 
      p._id === item._id || 
      p._id === item.productId || 
      p.id === item._id || 
      (item.name && p.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
    );
    if (matched && matched.image) {
      if (Array.isArray(matched.image) && matched.image.length > 0) {
        return cleanUrl(matched.image[0]);
      } else if (typeof matched.image === 'string') {
        return cleanUrl(matched.image);
      }
    }
  }

  return '';
};

const Orders = () => {

  const { backendUrl, token, currency, products } = useContext(ShopContext);

  const [orderData, setorderData] = useState([])
  const [loading, setLoading] = useState(true)

  const loadOrderData = async () => {
    try {
      if (!token) {
        setLoading(false);
        return null
      }

      const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } })
      if (response.data.success) {
        let allOrdersItem = []
        response.data.orders.map((order) => {
          let itemsList = order.items;
          if (typeof itemsList === 'string') {
            try {
              itemsList = JSON.parse(itemsList);
            } catch (e) {
              itemsList = [];
            }
          }
          if (Array.isArray(itemsList)) {
            itemsList.map((item) => {
              item['status'] = order.status
              item['payment'] = order.payment
              item['paymentMethod'] = order.paymentMethod
              item['date'] = order.date
              allOrdersItem.push(item)
            })
          }
        })
        setorderData(allOrdersItem.reverse())
      }
      
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrderData()
  }, [token])

  return (
    <div className='border-t pt-16 min-h-[80vh]'>

        <div className='text-2xl mb-6'>
            <Title text1={'MY'} text2={'ORDERS'}/>
        </div>

        <div>
            {orderData.length === 0 ? (
              <div className='py-16 text-center text-gray-500'>
                <span className='text-4xl block mb-2'>📦</span>
                <p className='text-sm font-semibold'>{loading ? "Loading your orders..." : "No orders found."}</p>
              </div>
            ) : (
              orderData.map((item, index) => {
                const imgUrl = getSafeImageUrl(item, products);

                return (
                  <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                      <div className='flex items-start gap-6 text-sm'>
                          {imgUrl ? (
                            <img 
                              className='w-16 sm:w-20 h-20 object-cover rounded-lg border border-gray-100 shadow-2xs' 
                              src={imgUrl} 
                              alt={item.name}
                              onError={(e) => {
                                // If image fails to load, fallback to product list lookup or hide
                                if (products.length > 0) {
                                  const fallback = products.find(p => p.name === item.name);
                                  if (fallback && fallback.image) {
                                    e.target.src = Array.isArray(fallback.image) ? fallback.image[0] : fallback.image;
                                    return;
                                  }
                                }
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className='w-16 sm:w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-2xl'>
                              🛍️
                            </div>
                          )}
                          <div>
                            <p className='sm:text-base font-semibold text-gray-900'>{item.name}</p>
                            <div className='flex items-center gap-3 mt-1 text-sm text-gray-700'>
                              <p className='font-bold text-black'>{currency}{item.price}</p>
                              <p>Qty: {item.quantity}</p>
                              <p className='px-2 py-0.5 border rounded bg-gray-50 text-xs font-bold'>Size {item.size}</p>
                            </div>
                            <p className='mt-1 text-xs text-gray-500'>Date: <span className='text-gray-700 font-medium'>{new Date(item.date).toDateString()}</span></p>
                            <p className='mt-1 text-xs text-gray-500'>Payment: <span className='text-gray-700 font-medium uppercase'>{item.paymentMethod}</span></p>
                          </div>
                      </div>
                      <div className='md:w-1/2 flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                              <p className='min-w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse'></p>
                              <p className='text-sm md:text-base font-medium text-gray-800'>{item.status}</p>
                          </div>
                          <button onClick={loadOrderData} className='border border-gray-300 hover:border-black px-4 py-2 text-xs font-bold rounded-lg transition shadow-2xs'>
                            Track Order
                          </button>
                      </div>
                  </div>
                );
              })
            )}
        </div>
    </div>
  )
}

export default Orders
