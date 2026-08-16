import React, { useContext, useState } from 'react'
import { assets } from '../assets/assets'
import { Link, NavLink } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {

    const [visible, setVisible] = useState(false);

    const { setShowSearch, getCartCount, navigate, token, setToken, setCartItems } = useContext(ShopContext);

    const logout = () => {
        navigate('/login')
        localStorage.removeItem('token')
        setToken('')
        setCartItems({})
    }

  return (
    <div className='flex items-center justify-between py-5 font-medium relative z-40'>
      
      <Link to='/'><img src={assets.logo} className='w-36' alt="" /></Link>

      <ul className='hidden sm:flex gap-5 text-sm text-gray-700'>
        
        <NavLink to='/' className='flex flex-col items-center gap-1'>
            <p>HOME</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/collection' className='flex flex-col items-center gap-1'>
            <p>COLLECTION</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/sleep-shop-vault' className='flex flex-col items-center gap-1 text-indigo-700 font-semibold'>
            <p>🌙 SLEEP & SHOP</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-indigo-700 hidden' />
        </NavLink>
        <NavLink to='/about' className='flex flex-col items-center gap-1'>
            <p>ABOUT</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>
        <NavLink to='/contact' className='flex flex-col items-center gap-1'>
            <p>CONTACT</p>
            <hr className='w-2/4 border-none h-[1.5px] bg-gray-700 hidden' />
        </NavLink>

      </ul>

      <div className='flex items-center gap-5'>
            <img onClick={()=> { setShowSearch(true); navigate('/collection') }} src={assets.search_icon} className='w-5 cursor-pointer hover:opacity-75 transition' alt="" />
            
            {/* Live In-App Notifications Hub */}
            <NotificationBell />

            <div className='group relative'>
                <img onClick={()=> token ? null : navigate('/login') } className='w-5 cursor-pointer hover:opacity-75 transition' src={assets.profile_icon} alt="" />
                {/* Dropdown Menu */}
                {token && 
                <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4 z-50'>
                    <div className='flex flex-col gap-2 w-44 py-3 px-4 bg-white text-gray-700 rounded-xl shadow-xl border border-gray-100 text-xs font-semibold'>
                        <p onClick={()=>navigate('/sleep-shop-vault')} className='cursor-pointer hover:text-indigo-600 flex items-center gap-1.5 text-indigo-700 font-bold'>🌙 Sleep & Shop Vault</p>
                        <p onClick={()=>navigate('/watchlist')} className='cursor-pointer hover:text-black'>📉 Watchlist Alerts</p>
                        <p onClick={()=>navigate('/orders')} className='cursor-pointer hover:text-black'>📦 My Orders</p>
                        <hr className='border-gray-100' />
                        <p onClick={logout} className='cursor-pointer hover:text-red-600 text-red-500'>Logout</p>
                    </div>
                </div>}
            </div> 

            <Link to='/cart' className='relative'>
                <img src={assets.cart_icon} className='w-5 min-w-5' alt="" />
                <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px] font-bold'>{getCartCount()}</p>
            </Link> 

            <img onClick={()=>setVisible(true)} src={assets.menu_icon} className='w-5 cursor-pointer sm:hidden' alt="" /> 
      </div>

        {/* Sidebar menu for small screens */}
        <div className={`fixed top-0 right-0 bottom-0 z-50 bg-white transition-all shadow-2xl ${visible ? 'w-full sm:w-80' : 'w-0 overflow-hidden'}`}>
                <div className='flex flex-col text-gray-600 text-sm'>
                    <div onClick={()=>setVisible(false)} className='flex items-center gap-4 p-4 cursor-pointer border-b'>
                        <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="" />
                        <p className='font-bold text-gray-900'>Close Menu</p>
                    </div>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-medium' to='/'>HOME</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-medium' to='/collection'>COLLECTION</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-bold text-indigo-700' to='/sleep-shop-vault'>🌙 SLEEP & SHOP VAULT</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-medium' to='/watchlist'>WATCHLIST ALERTS</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-medium' to='/orders'>MY ORDERS</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-medium' to='/about'>ABOUT</NavLink>
                    <NavLink onClick={()=>setVisible(false)} className='py-3 pl-6 border-b font-medium' to='/contact'>CONTACT</NavLink>
                </div>
        </div>

    </div>
  )
}

export default Navbar
