import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import TrustBadges from '../components/TrustBadges';
import BrandSizeConverterModal from '../components/BrandSizeConverterModal';
import SmartSizeAssistantModal from '../components/SmartSizeAssistantModal';
import FitScoreWidget from '../components/FitScoreWidget';
import CompleteTheLook from '../components/CompleteTheLook';
import BackInStockModal from '../components/BackInStockModal';
import SizeChartModal from '../components/SizeChartModal';
import axios from 'axios';
import { toast } from 'react-toastify';

const Product = () => {

  const { productId } = useParams();
  const { products, currency, addToCart, backendUrl, token } = useContext(ShopContext);
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState('')
  const [size, setSize] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [targetPrice, setTargetPrice] = useState('')

  // Modals state
  const [showBrandConverter, setShowBrandConverter] = useState(false);
  const [showSizeAssistant, setShowSizeAssistant] = useState(false);
  const [showBackInStock, setShowBackInStock] = useState(false);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [userMeasurements, setUserMeasurements] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('desc');

  const fetchProductData = async () => {
    products.map((item) => {
      if (item._id === productId) {
        setProductData(item);
        setImage(item.image[0]);
        if (item.sizes && item.sizes.length > 0 && !size) {
          setSize(item.sizes[0]);
        }
        return null;
      }
    });
  };

  const loadMeasurements = () => {
    const saved = localStorage.getItem('user_body_measurements');
    if (saved) {
      try {
        setUserMeasurements(JSON.parse(saved));
      } catch (e) {
        console.log(e);
      }
    }
  };

  const fetchPrediction = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/alert/predict/' + productId);
      if (response.data.success) {
        setPrediction(response.data.prediction);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleAddToCart = () => {
    if (!size) {
      toast.info("Please select your size from the Size Chart below");
      setShowSizeChart(true);
      return;
    }
    addToCart(productData._id, size);
  };

  const handleWatch = async () => {
    if (!token) {
      toast.error("Please login to set price alerts");
      return;
    }
    if (!targetPrice || Number(targetPrice) <= 0) {
      toast.error("Please enter a valid target price");
      return;
    }
    try {
      const response = await axios.post(
        backendUrl + '/api/alert/watch',
        { productId, targetPrice: Number(targetPrice) },
        { headers: { token } }
      );
      if (response.data.success) {
        toast.success(response.data.message || "Alert set successfully!");
        setTargetPrice('');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchProductData();
    fetchPrediction();
    loadMeasurements();
  }, [productId, products]);

  return productData ? (
    <div className='border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100'>
      {/*----------- Product Data-------------- */}
      <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>

        {/*---------- Product Images------------- */}
        <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
          <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
              {
                productData.image.map((item,index)=>(
                  <img onClick={()=>setImage(item)} src={item} key={index} className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer rounded-lg border border-gray-100 hover:border-black transition' alt="" />
                ))
              }
          </div>
          <div className='w-full sm:w-[80%]'>
              <img className='w-full h-auto rounded-xl shadow-xs' src={image} alt="" />
          </div>
        </div>

        {/* -------- Product Info ---------- */}
        <div className='flex-1'>
          <h1 className='font-medium text-2xl mt-2 text-gray-900'>{productData.name}</h1>
          <div className=' flex items-center gap-1 mt-2'>
              <img src={assets.star_icon} alt="" className="w-3.5" />
              <img src={assets.star_icon} alt="" className="w-3.5" />
              <img src={assets.star_icon} alt="" className="w-3.5" />
              <img src={assets.star_icon} alt="" className="w-3.5" />
              <img src={assets.star_dull_icon} alt="" className="w-3.5" />
              <p className='pl-2 text-xs text-gray-600 font-semibold'>(122 verified reviews)</p>
          </div>
          <p className='mt-4 text-3xl font-bold text-gray-900'>{currency}{productData.price}</p>
          <p className='mt-4 text-gray-600 text-sm leading-relaxed md:w-4/5'>{productData.description}</p>

          {/* Smart AI Fit Assistant & Fit Score Widget */}
          <FitScoreWidget
            measurements={userMeasurements}
            productSizes={productData.sizes || ['S', 'M', 'L', 'XL']}
            selectedSize={size}
            onSelectSize={(sz) => setSize(sz)}
            onOpenAssistant={() => setShowSizeAssistant(true)}
            onOpenBrandConverter={() => setShowBrandConverter(true)}
          />

          {/* Size Selection Area */}
          <div className='flex flex-col gap-2.5 my-4 p-4 rounded-xl border border-gray-200 bg-gray-50/70'>
              <div className='flex flex-wrap justify-between items-center gap-2'>
                <p className='text-xs font-bold uppercase tracking-wider text-gray-700'>
                  Selected Size: <span className='text-black font-black text-sm'>{size || 'None'}</span>
                </p>
                
                {/* Size Tools: Size Chart, Brand Converter, Assistant */}
                <div className='flex flex-wrap items-center gap-2 text-xs'>
                  <button 
                    type='button'
                    onClick={() => setShowSizeChart(true)} 
                    className='bg-black text-white hover:bg-gray-800 px-3 py-1 rounded-md font-bold transition shadow-xs flex items-center gap-1 cursor-pointer'
                  >
                    <span>📐</span> Size Chart
                  </button>
                  <button 
                    type='button'
                    onClick={() => setShowBrandConverter(true)} 
                    className='bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 px-2.5 py-1 rounded-md font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer'
                  >
                    <span>👗</span> Brand Converter
                  </button>
                  <button 
                    type='button'
                    onClick={() => setShowSizeAssistant(true)} 
                    className='bg-white text-orange-700 border border-orange-200 hover:bg-orange-50 px-2.5 py-1 rounded-md font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer'
                  >
                    <span>📏</span> Fit AI
                  </button>
                </div>
              </div>

              {/* Size Buttons */}
              <div className='flex flex-wrap gap-2 mt-1'>
                {productData.sizes.map((item,index)=>(
                  <button 
                    onClick={()=>setSize(item)} 
                    className={`border py-2 px-5 text-sm font-bold rounded-lg transition cursor-pointer ${item === size ? 'border-black bg-black text-white shadow-xs' : 'border-gray-300 bg-white text-gray-800 hover:border-black'}`} 
                    key={index}
                  >
                    {item}
                  </button>
                ))}
              </div>
          </div>

          {/* Buttons: Add to Cart & Back In Stock */}
          <div className='flex flex-wrap items-center gap-3 mt-6'>
            <button 
              onClick={handleAddToCart} 
              className='bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-gray-800 active:bg-gray-900 transition shadow-md cursor-pointer flex items-center gap-2'
            >
              <span>🛍️</span>
              <span>ADD TO CART</span>
            </button>
            <button 
              type='button'
              onClick={() => setShowSizeChart(true)}
              className='border border-gray-300 text-gray-800 px-4 py-3.5 text-xs font-bold rounded-xl hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer'
            >
              <span>📐</span>
              <span>View Size Chart</span>
            </button>
            <button 
              type='button'
              onClick={()=>setShowBackInStock(true)} 
              className='border border-gray-300 text-gray-700 px-4 py-3.5 text-xs font-bold rounded-xl hover:bg-gray-50 transition flex items-center gap-1.5 cursor-pointer'
              title='Notify Me When In Stock / Request Restock'
            >
              <span>🔔</span>
              <span>Restock Alert</span>
            </button>
          </div>

          {/* Trust Badges Widget */}
          <TrustBadges currentAmount={productData.price} freeShippingThreshold={100} currency={currency} />
          
          {/* Price Prediction & Watch Radar */}
          <div className='my-6 p-4 border border-gray-200 rounded-xl bg-gray-50/80 max-w-md'>
            <h3 className='font-bold text-xs uppercase tracking-wider text-gray-800 mb-2 flex items-center gap-2'>
              📉 Price Drop Radar
            </h3>
            {prediction && (
              <div className={`mb-3 p-3 rounded-lg text-xs ${prediction.recommendation === 'WAIT' ? 'bg-orange-50 border border-orange-200 text-orange-800' : 'bg-green-50 border border-green-200 text-green-800'}`}>
                <span className='font-bold block mb-1'>Prediction: {prediction.recommendation}</span>
                <p>{prediction.message}</p>
              </div>
            )}
            
            <div className='mt-2'>
              <label className='block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1'>Set Target Price Drop Alert</label>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs'>{currency}</span>
                  <input 
                    type='number' 
                    className='w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs outline-none bg-white' 
                    placeholder={`Target (e.g. ${Math.round(productData.price * 0.85)})`}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                  />
                </div>
                <button 
                  onClick={handleWatch}
                  className='bg-black text-white text-xs px-4 py-2 rounded-lg hover:bg-gray-800 active:bg-gray-900 transition font-semibold'
                >
                  Watch Price
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Complete The Look (Smart Bundle Upsell with 15% OFF) */}
      <CompleteTheLook currentProduct={productData} />

      {/* ---------- Description & Review Tabs ------------- */}
      <div className='mt-16'>
        <div className='flex border-b border-gray-200'>
          <button
            type='button'
            onClick={() => setActiveDetailTab('desc')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeDetailTab === 'desc'
                ? 'border-b-2 border-black bg-gray-50 text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Description & Fabric
          </button>
          <button
            type='button'
            onClick={() => setActiveDetailTab('reviews')}
            className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
              activeDetailTab === 'reviews'
                ? 'border-b-2 border-black bg-gray-50 text-black'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            Reviews (122)
          </button>
        </div>

        {activeDetailTab === 'desc' && (
          <div className='flex flex-col gap-4 border border-t-0 px-6 py-6 text-sm text-gray-600 rounded-b-xl bg-white shadow-2xs'>
            <p>
              Engineered with high-tensile breathable fabric and pre-shrunk cotton blends to ensure long-lasting silhouette integrity and comfortable drape. Designed with timeless modern aesthetics that transition effortlessly between casual and semi-formal wear.
            </p>
            <p>
              <strong>Care Instructions:</strong> Machine wash cold with like colors. Gentle cycle. Do not bleach. Tumble dry low or air hang dry. Warm iron if needed.
            </p>
          </div>
        )}

        {activeDetailTab === 'reviews' && (
          <div className='border border-t-0 p-6 rounded-b-xl bg-white text-sm text-gray-600 shadow-2xs'>
            <div className='flex items-center gap-2 mb-4'>
              <span className='text-lg font-bold text-gray-900'>4.9 out of 5</span>
              <span className='text-yellow-500 font-black'>★★★★★</span>
              <span className='text-xs text-gray-400'>(122 verified buyer reviews)</span>
            </div>
            <div className='divide-y divide-gray-100'>
              <div className='py-3'>
                <p className='font-bold text-gray-800 text-xs'>Sophia M. — <span className='text-green-600'>Verified Buyer (Purchased Size M)</span></p>
                <p className='text-xs text-gray-600 mt-1'>"The size chart was 100% spot on! Fits perfectly across the chest and waist. Great fabric quality!"</p>
              </div>
              <div className='py-3'>
                <p className='font-bold text-gray-800 text-xs'>Elena R. — <span className='text-green-600'>Verified Buyer (Purchased Size S)</span></p>
                <p className='text-xs text-gray-600 mt-1'>"Accurate sizing and lovely drape. Highly recommend following the bust measurement in the chart."</p>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* --------- Display Related Products ---------- */}
      <RelatedProducts category={productData.category} subCategory={productData.subCategory} />

      {/* Modals */}
      <SizeChartModal
        isOpen={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        product={productData}
        selectedSize={size}
        onSelectSize={(sz) => setSize(sz)}
      />

      <BrandSizeConverterModal
        isOpen={showBrandConverter}
        onClose={() => setShowBrandConverter(false)}
        availableSizes={productData.sizes || []}
        onApplySize={(sz) => setSize(sz)}
      />

      <SmartSizeAssistantModal
        isOpen={showSizeAssistant}
        onClose={() => setShowSizeAssistant(false)}
        onSavedMeasurements={(m) => setUserMeasurements(m)}
      />

      <BackInStockModal
        isOpen={showBackInStock}
        onClose={() => setShowBackInStock(false)}
        product={productData}
        initialSize={size}
      />

    </div>
  ) : <div className=' opacity-0'></div>
}

export default Product
