import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const Watchlist = () => {
    const { token, backendUrl, currency } = useContext(ShopContext);
    const [watchlist, setWatchlist] = useState([]);
    const [predictions, setPredictions] = useState({});

    const fetchWatchlist = async () => {
        if (!token) return;
        try {
            const response = await axios.post(backendUrl + '/api/alert/watchlist', {}, { headers: { token } });
            if (response.data.success) {
                setWatchlist(response.data.watchlist);
                // Fetch predictions for all watched products
                response.data.watchlist.forEach(item => {
                    fetchPrediction(item.productId);
                });
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    const fetchPrediction = async (productId) => {
        try {
            const response = await axios.get(backendUrl + `/api/alert/predict/${productId}`);
            if (response.data.success) {
                setPredictions(prev => ({
                    ...prev,
                    [productId]: response.data.prediction
                }));
            }
        } catch (error) {
            console.log(error);
        }
    };

    const handleUnwatch = async (productId) => {
        try {
            const response = await axios.post(
                backendUrl + '/api/alert/unwatch',
                { productId },
                { headers: { token } }
            );
            if (response.data.success) {
                toast.success(response.data.message);
                setWatchlist(prev => prev.filter(item => item.productId !== productId));
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    useEffect(() => {
        fetchWatchlist();
    }, [token]);

    if (!token) {
        return (
            <div className='flex flex-col items-center justify-center min-h-[50vh] text-center'>
                <p className='text-gray-500 mb-4'>Please login to view your price watchlist.</p>
                <Link to='/login' className='bg-black text-white px-8 py-3 text-sm'>Login Here</Link>
            </div>
        );
    }

    return (
        <div className='border-t pt-16'>
            <div className='text-2xl mb-8'>
                <Title text1={'MY'} text2={'WATCHLIST'} />
            </div>

            {watchlist.length === 0 ? (
                <div className='text-center py-20 text-gray-500'>
                    <p className='mb-4'>You are not watching any products yet.</p>
                    <Link to='/' className='bg-black text-white px-6 py-2.5 text-sm'>Explore Products</Link>
                </div>
            ) : (
                <div className='flex flex-col gap-6'>
                    {watchlist.map((item, index) => {
                        const pred = predictions[item.productId];
                        return (
                            <div key={index} className='p-5 border border-gray-200 rounded-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white shadow-sm hover:shadow-md transition-shadow'>
                                <div className='flex items-start gap-6 text-sm flex-1'>
                                    <Link to={`/product/${item.productId}`} className='flex-shrink-0'>
                                        <img className='w-16 sm:w-20 object-cover rounded' src={item.image[0]} alt={item.name} />
                                    </Link>
                                    <div className='flex-1'>
                                        <Link to={`/product/${item.productId}`} className='sm:text-lg font-medium text-gray-900 hover:text-orange-500 transition-colors'>
                                            {item.name}
                                        </Link>
                                        <div className='flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-sm text-gray-700'>
                                            <p><span className='text-gray-500'>Current:</span> <span className='font-semibold'>{currency}{item.currentPrice}</span></p>
                                            <p><span className='text-gray-500'>Target:</span> <span className='font-semibold text-orange-600'>{currency}{item.targetPrice}</span></p>
                                        </div>
                                        
                                        {/* Prediction Banner inside Watchlist card */}
                                        {pred && (
                                            <div className={`mt-3 p-2.5 rounded text-xs inline-block max-w-lg ${pred.recommendation === 'WAIT' ? 'bg-orange-50 text-orange-800 border border-orange-100' : 'bg-green-50 text-green-800 border border-green-100'}`}>
                                                <span className='font-bold uppercase tracking-wider block mb-0.5'>{pred.recommendation} Recommendation</span>
                                                <p className='font-medium'>{pred.message}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className='flex items-center gap-4 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0'>
                                    <button 
                                        onClick={() => handleUnwatch(item.productId)} 
                                        className='text-xs font-semibold text-red-500 hover:text-red-700 active:scale-95 transition-transform uppercase tracking-wider border border-red-200 hover:border-red-400 px-3 py-1.5 rounded'
                                    >
                                        Stop Watching
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Watchlist;
