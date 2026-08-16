import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import axios from 'axios'
import { backendUrl, currency } from '../App'
import { toast } from 'react-toastify'
import { assets } from '../assets/assets'

// Helper to extract a clean image URL
const getSafeImageUrl = (item) => {
  if (!item) return '';

  const cleanUrl = (val) => {
    if (!val || typeof val !== 'string') return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return cleanUrl(parsed[0]);
        }
        if (typeof parsed === 'string') return cleanUrl(parsed);
      } catch (e) {}
    }
    return trimmed.replace(/^["']|["']$/g, '');
  };

  if (item.image) {
    if (Array.isArray(item.image) && item.image.length > 0) {
      const resolved = cleanUrl(item.image[0]);
      if (resolved) return resolved;
    } else if (typeof item.image === 'string') {
      const resolved = cleanUrl(item.image);
      if (resolved) return resolved;
    }
  }

  if (item.images) {
    if (Array.isArray(item.images) && item.images.length > 0) {
      const resolved = cleanUrl(item.images[0]);
      if (resolved) return resolved;
    } else if (typeof item.images === 'string') {
      const resolved = cleanUrl(item.images);
      if (resolved) return resolved;
    }
  }

  return '';
};

const Orders = ({ token }) => {

  const [orders, setOrders] = useState([])

  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } })
      if (response.data.success) {
        setOrders(response.data.orders.reverse())
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  const statusHandler = async ( event, orderId ) => {
    try {
      const response = await axios.post(backendUrl + '/api/order/status' , {orderId, status:event.target.value}, { headers: {token}})
      if (response.data.success) {
        await fetchAllOrders()
        toast.success("Order status updated")
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchAllOrders();
  }, [token])

  return (
    <div>
      <h3 className='font-bold text-lg mb-4 text-gray-800'>Customer Orders</h3>
      <div className='flex flex-col gap-4'>
        {orders.length === 0 ? (
          <div className='p-8 text-center text-gray-500 bg-white border border-gray-200 rounded-lg'>
            <p className='text-sm'>No customer orders found.</p>
          </div>
        ) : (
          orders.map((order, index) => {
            let itemsList = order.items;
            if (typeof itemsList === 'string') {
              try {
                itemsList = JSON.parse(itemsList);
              } catch (e) {
                itemsList = [];
              }
            }

            return (
              <div 
                className='grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr] lg:grid-cols-[1.5fr_2fr_1fr_1fr_1fr] gap-4 items-start border border-gray-200 bg-white rounded-xl p-5 md:p-6 shadow-xs text-xs sm:text-sm text-gray-700' 
                key={index}
              >
                {/* Ordered Items with Thumbnails */}
                <div className='flex flex-col gap-3'>
                  <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Ordered Items ({itemsList.length})</span>
                  <div className='flex flex-col gap-2.5'>
                    {itemsList.map((item, idx) => {
                      const imgUrl = getSafeImageUrl(item);

                      return (
                        <div key={idx} className='flex items-center gap-2.5 p-1.5 rounded-lg border border-gray-100 bg-gray-50/70'>
                          {imgUrl ? (
                            <img 
                              className='w-12 h-14 object-cover rounded-md border border-gray-200 bg-white' 
                              src={imgUrl} 
                              alt={item.name}
                              onError={(e) => { e.target.src = assets.parcel_icon; }}
                            />
                          ) : (
                            <img className='w-10 h-10 object-contain' src={assets.parcel_icon} alt="" />
                          )}
                          <div className='flex-1 min-w-0'>
                            <p className='font-semibold text-gray-900 text-xs truncate'>{item.name}</p>
                            <p className='text-[11px] text-gray-500 mt-0.5'>
                              Qty: <span className='font-bold text-gray-800'>{item.quantity}</span> | Size: <span className='font-bold text-black'>{item.size}</span>
                            </p>
                            {item.price && (
                              <p className='text-[11px] font-bold text-gray-900'>{currency}{item.price}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer & Shipping Details */}
                <div>
                  <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Customer & Delivery</span>
                  <p className='mt-1 font-bold text-gray-900 text-sm'>
                    {order.address?.firstName || ''} {order.address?.lastName || ''}
                  </p>
                  <div className='text-xs text-gray-600 mt-1 leading-relaxed'>
                    <p>{order.address?.street}</p>
                    <p>{order.address?.city}, {order.address?.state}, {order.address?.country} - {order.address?.zipcode}</p>
                    <p className='mt-1 font-semibold text-gray-800'>📞 {order.address?.phone}</p>
                    {order.address?.email && (
                      <p className='text-[11px] text-gray-500'>✉️ {order.address?.email}</p>
                    )}
                  </div>
                </div>

                {/* Payment & Order Summary */}
                <div>
                  <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Payment Info</span>
                  <p className='mt-1 text-xs'>Method: <span className='font-bold text-gray-900 uppercase'>{order.paymentMethod}</span></p>
                  <p className='mt-1 text-xs flex items-center gap-1.5'>
                    Payment: 
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.payment ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {order.payment ? 'Paid' : 'Pending'}
                    </span>
                  </p>
                  <p className='mt-2 text-[11px] text-gray-400'>
                    {new Date(Number(order.date)).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Amount */}
                <div>
                  <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider'>Total Amount</span>
                  <p className='text-base font-black text-gray-900 mt-1'>{currency}{order.amount}</p>
                </div>

                {/* Status Dropdown */}
                <div>
                  <span className='text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1'>Order Status</span>
                  <select 
                    onChange={(event) => statusHandler(event, order._id)} 
                    value={order.status} 
                    className='w-full p-2 text-xs font-bold border border-gray-300 rounded-lg bg-white outline-none focus:border-black shadow-2xs'
                  >
                    <option value="Order Placed">Order Placed</option>
                    <option value="Packing">Packing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for delivery">Out for delivery</option>
                    <option value="Delivered">Delivered</option>
                  </select>
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