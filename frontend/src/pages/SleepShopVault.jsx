import React, { useState, useEffect, useContext } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getSafeImageUrl } from './Orders';

const CountdownTimer = ({ targetTimestamp, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, isExpired: false });

  useEffect(() => {
    const updateTimer = () => {
      const difference = Number(targetTimestamp) - Date.now();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, isExpired: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  if (timeLeft.isExpired) {
    return <span className='text-xs font-bold text-green-600 animate-pulse'>Ready for Auto-Processing!</span>;
  }

  return (
    <div className='flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg'>
      <span>⏱️</span>
      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
      <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>:
      <span>{String(timeLeft.seconds).padStart(2, '0')}s remaining</span>
    </div>
  );
};

const SleepShopVault = () => {
  const { backendUrl, token, currency, navigate, products } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDeferredOrders = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.post(
        backendUrl + '/api/deferred-order/user-orders',
        {},
        { headers: { token } }
      );
      if (response.data && response.data.success) {
        setOrders(response.data.deferredOrders || []);
      } else if (response.data && response.data.message) {
        console.warn("Sleep & Shop Vault:", response.data.message);
        if (response.data.message.includes('Login Again')) {
          toast.info("Please login again to sync your Vault.");
        }
      }
    } catch (err) {
      console.error("Sleep & Shop Vault error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to load Sleep & Shop orders.";
      if (err.response?.status === 404) {
        console.warn("Backend route not active yet. Please ensure backend server is restarted.");
      } else {
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeferredOrders();
  }, [token]);

  const handleCancel = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled purchase?")) return;
    setActionLoading(orderId);
    try {
      const response = await axios.post(
        backendUrl + '/api/deferred-order/cancel',
        { orderId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("Deferred purchase cancelled successfully.");
        fetchDeferredOrders();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExecuteNow = async (orderId) => {
    setActionLoading(orderId);
    try {
      const response = await axios.post(
        backendUrl + '/api/deferred-order/execute-now',
        { orderId },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success("🎉 Order processed immediately!");
        navigate('/orders');
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const scheduledOrders = orders.filter(o => o.status === 'scheduled');
  const pastOrders = orders.filter(o => o.status !== 'scheduled');

  if (!token) {
    return (
      <div className='border-t pt-16 text-center min-h-[50vh] flex flex-col items-center justify-center'>
        <span className='text-5xl mb-4'>🌙</span>
        <h2 className='text-xl font-bold text-gray-900'>Sleep & Shop Vault</h2>
        <p className='text-xs text-gray-500 mt-2 max-w-sm'>
          Please login to view and manage your scheduled deferred purchases.
        </p>
        <button
          onClick={() => navigate('/login')}
          className='mt-6 bg-black text-white px-8 py-2.5 rounded-lg text-xs font-semibold hover:bg-gray-800'
        >
          Login to Your Account
        </button>
      </div>
    );
  }

  return (
    <div className='border-t pt-12 min-h-[80vh]'>
      <div className='flex flex-wrap justify-between items-end mb-6 gap-4'>
        <div>
          <div className='text-2xl'>
            <Title text1={'SLEEP & SHOP'} text2={'VAULT'} />
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Manage your deferred purchases, review cooldown timers, or execute orders instantly.
          </p>
        </div>

        <button
          onClick={() => navigate('/collection')}
          className='text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition'
        >
          + Continue Shopping
        </button>
      </div>

      {loading ? (
        <div className='py-20 text-center text-xs text-gray-500'>Loading your vault...</div>
      ) : (
        <div className='flex flex-col gap-10'>
          {/* Active Scheduled Purchases */}
          <div>
            <div className='flex items-center gap-2 mb-4'>
              <h3 className='text-sm font-bold text-gray-900 uppercase tracking-wider'>
                Active Scheduled Orders ({scheduledOrders.length})
              </h3>
              <span className='bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full'>
                Cooldown In Progress
              </span>
            </div>

            {scheduledOrders.length === 0 ? (
              <div className='p-8 rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-center'>
                <span className='text-3xl block mb-2'>🛌</span>
                <p className='text-xs font-bold text-gray-700'>No active scheduled orders in your Vault</p>
                <p className='text-[11px] text-gray-500 mt-1'>
                  Choose "Sleep & Shop" at checkout to sleep on any purchase before it auto-processes!
                </p>
              </div>
            ) : (
              <div className='flex flex-col gap-4'>
                {scheduledOrders.map((order) => {
                  let triggerBadge = '🌙 Cooldown Timer';
                  if (order.triggerCondition === 'midnight_flash_sale') triggerBadge = '⚡ Midnight Flash Sale (12 AM)';
                  if (order.triggerCondition === 'price_drop') triggerBadge = `📉 Price Drop Target (${order.triggerValue})`;
                  if (order.triggerCondition === 'restock') triggerBadge = '📦 Restock Auto-Buy';

                  return (
                    <div
                      key={order._id}
                      className='p-5 rounded-2xl border border-indigo-200 bg-gradient-to-br from-white via-indigo-50/20 to-white shadow-sm flex flex-col md:flex-row justify-between gap-6'
                    >
                      {/* Left: Info */}
                      <div className='flex-1'>
                        <div className='flex flex-wrap items-center gap-2.5 mb-3'>
                          <span className='bg-black text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase'>
                            {triggerBadge}
                          </span>
                          <CountdownTimer
                            targetTimestamp={order.scheduledExecutionTime}
                            onExpire={() => fetchDeferredOrders()}
                          />
                        </div>

                        {/* Items list */}
                        <div className='flex flex-col gap-3 my-3'>
                          {(order.items || []).map((item, idx) => {
                            const imgUrl = getSafeImageUrl(item, products);
                            return (
                              <div key={idx} className='flex items-center gap-3'>
                                {imgUrl ? (
                                  <img
                                    src={imgUrl}
                                    alt={item.name}
                                    className='w-12 h-14 object-cover rounded-md border border-gray-100'
                                  />
                                ) : (
                                  <div className='w-12 h-14 bg-gray-100 rounded-md flex items-center justify-center text-lg'>
                                    🛍️
                                  </div>
                                )}
                                <div>
                                  <h4 className='text-xs font-bold text-gray-900'>{item.name}</h4>
                                  <p className='text-[11px] text-gray-500'>
                                    Size: <span className='font-semibold text-gray-800'>{item.size}</span> | Qty: {item.quantity} | {currency}{item.price}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className='text-xs text-gray-600 mt-2 flex flex-wrap gap-4 pt-2 border-t border-gray-100'>
                          <span><strong>Total:</strong> {currency}{order.amount}</span>
                          <span><strong>Payment:</strong> {order.paymentMethod?.toUpperCase()}</span>
                          <span><strong>Deliver to:</strong> {order.address?.city}, {order.address?.state}</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className='flex md:flex-col justify-end md:justify-center gap-2 min-w-44'>
                        <button
                          type='button'
                          disabled={actionLoading === order._id}
                          onClick={() => handleExecuteNow(order._id)}
                          className='flex-1 md:flex-none bg-black hover:bg-gray-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer'
                        >
                          <span>⚡</span>
                          <span>{actionLoading === order._id ? "Processing..." : "Buy Now Immediately"}</span>
                        </button>
                        <button
                          type='button'
                          disabled={actionLoading === order._id}
                          onClick={() => handleCancel(order._id)}
                          className='flex-1 md:flex-none border border-red-300 text-red-600 hover:bg-red-50 text-xs font-semibold py-2.5 px-4 rounded-xl transition cursor-pointer'
                        >
                          Cancel Deferred Order
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Past Vault History */}
          {pastOrders.length > 0 && (
            <div>
              <h3 className='text-sm font-bold text-gray-700 uppercase tracking-wider mb-4'>
                Vault History ({pastOrders.length})
              </h3>
              <div className='divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white'>
                {pastOrders.map((order) => (
                  <div key={order._id} className='p-4 flex flex-wrap justify-between items-center gap-4 text-xs'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='font-bold text-gray-900'>Order #{order._id?.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          order.status === 'executed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className='text-gray-500 text-[11px] mt-0.5'>
                        {order.items?.length} items • {currency}{order.amount} • {new Date(Number(order.date)).toLocaleDateString()}
                      </p>
                    </div>

                    {order.status === 'executed' && (
                      <button
                        onClick={() => navigate('/orders')}
                        className='text-xs font-semibold text-indigo-600 hover:underline'
                      >
                        View in Live Orders →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SleepShopVault;
