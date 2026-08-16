import React, { useState, useEffect, useContext, useRef } from 'react';
import { ShopContext } from '../context/ShopContext';
import axios from 'axios';

const NotificationBell = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await axios.post(
        backendUrl + '/api/stock-alert/notifications',
        {},
        { headers: { token } }
      );
      if (response.data.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (err) {
      console.log("Error fetching notifications:", err.message);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Polling every 15s
    return () => clearInterval(interval);
  }, [token]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    if (!token) return;
    try {
      await axios.post(
        backendUrl + '/api/stock-alert/notifications/read',
        { notificationId: 'all' },
        { headers: { token } }
      );
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.log(err);
    }
  };

  const handleNotificationClick = (item) => {
    setIsOpen(false);
    if (item.type === 'sleep_and_shop') {
      navigate('/sleep-shop-vault');
    } else if (item.data && item.data.productId) {
      navigate(`/product/${item.data.productId}`);
    } else {
      navigate('/orders');
    }
  };

  if (!token) return null;

  return (
    <div className='relative' ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='relative p-2 rounded-full hover:bg-gray-100 transition cursor-pointer text-gray-700'
        title='Notifications'
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className='absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div className='absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-fade-in'>
          <div className='flex items-center justify-between px-4 pb-2.5 border-b border-gray-100'>
            <div className='flex items-center gap-2'>
              <h3 className='text-xs font-bold text-gray-900 uppercase tracking-wide'>Notifications</h3>
              {unreadCount > 0 && (
                <span className='bg-black text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full'>
                  {unreadCount} new
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                className='text-[10px] font-semibold text-gray-500 hover:text-black transition'
              >
                Mark all read
              </button>
            )}
          </div>

          <div className='max-h-80 overflow-y-auto divide-y divide-gray-50'>
            {notifications.length === 0 ? (
              <div className='py-8 text-center text-xs text-gray-400'>
                <p className='text-2xl mb-1'>📭</p>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((item) => {
                let icon = '🔔';
                if (item.type === 'sleep_and_shop') icon = '🌙';
                if (item.type === 'stock_alert') icon = '📦';
                if (item.type === 'price_drop') icon = '📉';

                return (
                  <div
                    key={item._id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3 hover:bg-gray-50 transition cursor-pointer flex gap-3 items-start ${
                      !item.read ? 'bg-indigo-50/40' : ''
                    }`}
                  >
                    <span className='text-lg mt-0.5'>{icon}</span>
                    <div className='flex-1'>
                      <div className='flex justify-between items-start'>
                        <h4 className='text-xs font-bold text-gray-900 leading-tight'>{item.title}</h4>
                        <span className='text-[9px] text-gray-400'>
                          {new Date(Number(item.date)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className='text-[11px] text-gray-600 mt-1 leading-snug'>{item.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className='px-4 pt-2.5 border-t border-gray-100 flex justify-between items-center text-[10px] text-gray-500'>
            <span
              onClick={() => { setIsOpen(false); navigate('/sleep-shop-vault'); }}
              className='hover:underline font-semibold cursor-pointer text-indigo-600'
            >
              🌙 View Sleep & Shop Vault →
            </span>
            <span
              onClick={() => { setIsOpen(false); navigate('/orders'); }}
              className='hover:underline font-semibold cursor-pointer'
            >
              All Orders →
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
