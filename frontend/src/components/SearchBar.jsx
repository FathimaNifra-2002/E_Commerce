import React, { useContext, useEffect, useState, useRef } from 'react'
import { ShopContext } from '../context/ShopContext'
import { assets } from '../assets/assets';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const SearchBar = () => {

    const { 
        search, setSearch, showSearch, setShowSearch, 
        backendUrl, setReverseSearchResults, setIsVisualSearchActive, 
        isVisualSearchActive, clearVisualSearch 
    } = useContext(ShopContext);
    
    const [visible, setVisible] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const fileInputRef = useRef(null)
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.pathname.includes('collection')) {
            setVisible(true);
        }
        else {
            setVisible(false)
        }
    }, [location])

    const handleCameraClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    const handleFileChange = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('image', file)

        setAnalyzing(true)
        const toastId = toast.loading("AI is analyzing outfit colors, patterns & styles...")

        try {
            const response = await axios.post(backendUrl + '/api/product/reverse-search', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            if (response.data.success) {
                setReverseSearchResults(response.data.products)
                setIsVisualSearchActive(true)
                toast.update(toastId, { 
                    render: `Reverse Search successful! Found ${response.data.products.length} visually similar items.`, 
                    type: "success", 
                    isLoading: false, 
                    autoClose: 3000 
                })
                navigate('/collection')
            } else {
                toast.update(toastId, { 
                    render: response.data.message || "Failed to analyze image", 
                    type: "error", 
                    isLoading: false, 
                    autoClose: 3000 
                })
            }
        } catch (error) {
            console.error(error)
            toast.update(toastId, { 
                render: error.message || "Connection error to visual search engine", 
                type: "error", 
                isLoading: false, 
                autoClose: 3000 
            })
        } finally {
            setAnalyzing(false)
            if (fileInputRef.current) fileInputRef.current.value = "" // Reset file input
        }
    }
    
  return showSearch && visible ? (
    <div className='border-t border-b bg-gray-50 text-center py-4'>
      <div className='inline-flex items-center justify-center border border-gray-400 px-5 py-2 my-2 mx-3 rounded-full w-3/4 sm:w-1/2 bg-white shadow-sm'>
        {isVisualSearchActive ? (
          <div className='flex items-center bg-gray-100 px-3 py-1 rounded-full text-xs text-black font-semibold mr-2 border border-gray-300 gap-1 animate-pulse'>
            <span>📷 Visual Match Active</span>
            <span onClick={clearVisualSearch} className='cursor-pointer text-gray-500 hover:text-black font-bold ml-1'>✕</span>
          </div>
        ) : null}
        <input 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className='flex-1 outline-none bg-inherit text-sm' 
          type="text" 
          placeholder={isVisualSearchActive ? 'Refine visual matches with text...' : 'Search items...'}
        />
        
        {/* Hidden File Input for Reverse Search */}
        <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className='hidden'
        />
        
        <div className='flex items-center gap-3 ml-2 border-l pl-3 border-gray-300'>
            {/* Camera Trigger */}
            <div onClick={handleCameraClick} title="Reverse Search: Find by Photo" className='relative'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 cursor-pointer hover:text-black transition duration-150">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                </svg>
                {analyzing && (
                    <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-green-400 animate-ping"></span>
                )}
            </div>
            <img className='w-4 text-gray-400' src={assets.search_icon} alt="" />
        </div>
      </div>
      <img onClick={() => { setShowSearch(false); clearVisualSearch(); }} className='inline w-3 cursor-pointer ml-2 hover:scale-110 transition' src={assets.cross_icon} alt="" />
    </div>
  ) : null
}

export default SearchBar
