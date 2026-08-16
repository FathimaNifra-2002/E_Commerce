import React, { useContext, useState } from 'react'
import Title from '../components/Title'
import CartTotal from '../components/CartTotal'
import { assets } from '../assets/assets'
import { ShopContext } from '../context/ShopContext'
import TrustBadges from '../components/TrustBadges'
import SleepShopModal from '../components/SleepShopModal'
import axios from 'axios'
import { toast } from 'react-toastify'

const PlaceOrder = () => {

    const [method, setMethod] = useState('cod');
    const [showSleepShop, setShowSleepShop] = useState(false);
    const { navigate, backendUrl, token, cartItems, setCartItems, getCartAmount, delivery_fee, products, addToCart, currency } = useContext(ShopContext);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        country: '',
        phone: ''
    })

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setFormData(data => ({ ...data, [name]: value }))
    }

    const initPay = (order) => {
        const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: order.amount,
            currency: order.currency,
            name:'Order Payment',
            description:'Order Payment',
            order_id: order.id,
            receipt: order.receipt,
            handler: async (response) => {
                console.log(response)
                try {
                    
                    const { data } = await axios.post(backendUrl + '/api/order/verifyRazorpay',response,{headers:{token}})
                    if (data.success) {
                        navigate('/orders')
                        setCartItems({})
                    }
                } catch (error) {
                    console.log(error)
                    toast.error(error)
                }
            }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
    }

    const onSubmitHandler = async (event) => {
        event.preventDefault()
        try {

            let orderItems = []

            for (const items in cartItems) {
                for (const item in cartItems[items]) {
                    if (cartItems[items][item] > 0) {
                        const itemInfo = structuredClone(products.find(product => product._id === items))
                        if (itemInfo) {
                            itemInfo.size = item
                            itemInfo.quantity = cartItems[items][item]
                            orderItems.push(itemInfo)
                        }
                    }
                }
            }

            let orderData = {
                address: formData,
                items: orderItems,
                amount: getCartAmount() + delivery_fee
            }
            

            switch (method) {

                // API Calls for COD
                case 'cod':
                    const response = await axios.post(backendUrl + '/api/order/place',orderData,{headers:{token}})
                    if (response.data.success) {
                        setCartItems({})
                        navigate('/orders')
                    } else {
                        toast.error(response.data.message)
                    }
                    break;

                case 'stripe':
                    const responseStripe = await axios.post(backendUrl + '/api/order/stripe',orderData,{headers:{token}})
                    if (responseStripe.data.success) {
                        const {session_url} = responseStripe.data
                        window.location.replace(session_url)
                    } else {
                        toast.error(responseStripe.data.message)
                    }
                    break;

                case 'razorpay':

                    const responseRazorpay = await axios.post(backendUrl + '/api/order/razorpay', orderData, {headers:{token}})
                    if (responseRazorpay.data.success) {
                        initPay(responseRazorpay.data.order)
                    }

                    break;

                default:
                    break;
            }


        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }


    return (
        <form onSubmit={onSubmitHandler} className='flex flex-col sm:flex-row justify-between gap-4 pt-5 sm:pt-14 min-h-[80vh] border-t'>
            {/* ------------- Left Side ---------------- */}
            <div className='flex flex-col gap-4 w-full sm:max-w-[480px]'>

                <div className='text-xl sm:text-2xl my-3'>
                    <Title text1={'DELIVERY'} text2={'INFORMATION'} />
                </div>
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='firstName' value={formData.firstName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='First name' />
                    <input required onChange={onChangeHandler} name='lastName' value={formData.lastName} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Last name' />
                </div>
                <input required onChange={onChangeHandler} name='email' value={formData.email} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="email" placeholder='Email address' />
                <input required onChange={onChangeHandler} name='street' value={formData.street} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Street' />
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='city' value={formData.city} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='City' />
                    <input onChange={onChangeHandler} name='state' value={formData.state} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='State' />
                </div>
                <div className='flex gap-3'>
                    <input required onChange={onChangeHandler} name='zipcode' value={formData.zipcode} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Zipcode' />
                    <input required onChange={onChangeHandler} name='country' value={formData.country} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="text" placeholder='Country' />
                </div>
                <input required onChange={onChangeHandler} name='phone' value={formData.phone} className='border border-gray-300 rounded py-1.5 px-3.5 w-full' type="number" placeholder='Phone' />
            </div>

            {/* ------------- Right Side ------------------ */}
            <div className='mt-8'>

                <div className='mt-8 min-w-80'>
                    <CartTotal />
                </div>

                {/* ------------- Size Anxiety Index (AI Fit Assessment) ------------------ */}
                {(() => {
                    const getOrderItems = () => {
                        let itemsList = []
                        for (const items in cartItems) {
                            for (const item in cartItems[items]) {
                                if (cartItems[items][item] > 0) {
                                    const itemInfo = products.find(product => product._id === items)
                                    if (itemInfo) {
                                        itemsList.push({
                                            ...itemInfo,
                                            size: item,
                                            quantity: cartItems[items][item]
                                        })
                                    }
                                }
                            }
                        }
                        return itemsList
                    }
                    const orderItems = getOrderItems()
                    const cartItemsCount = orderItems.length

                    const [gender, setGender] = useState('Men');
                    const [height, setHeight] = useState('');
                    const [weight, setWeight] = useState('');
                    const [waist, setWaist] = useState('');
                    const [chest, setChest] = useState('');
                    const [fitAssessments, setFitAssessments] = useState({});
                    const [loadingScore, setLoadingScore] = useState(false);

                    const checkFitScores = async () => {
                        if (!height || !weight) {
                            toast.error("Please enter height and weight to assess fit.");
                            return;
                        }
                        if (orderItems.length === 0) {
                            toast.error("Your cart is empty!");
                            return;
                        }

                        setLoadingScore(true);
                        const results = {};

                        try {
                            for (const item of orderItems) {
                                const response = await axios.post(backendUrl + '/api/order/calculate-fit-risk', {
                                    height,
                                    weight,
                                    waist: waist || undefined,
                                    chest: chest || undefined,
                                    selectedSize: item.size,
                                    productId: item._id,
                                    gender
                                }, { headers: { token } });

                                if (response.data.success) {
                                    const key = `${item._id}_${item.size}`;
                                    results[key] = response.data;
                                }
                            }
                            setFitAssessments(results);
                            toast.success("Fit assessments calculated!");
                        } catch (error) {
                            console.error(error);
                            toast.error("Failed to calculate fit confidence score.");
                        } finally {
                            setLoadingScore(false);
                        }
                    }

                    return cartItemsCount > 0 ? (
                        <div className='mt-8 border border-gray-300 rounded-lg p-5 bg-white shadow-sm min-w-80'>
                            <div className='flex items-center gap-2 mb-3'>
                                <span className='text-xl'>📊</span>
                                <h3 className='text-sm font-bold text-gray-800 uppercase tracking-wider'>AI Fit Return-Risk Check</h3>
                            </div>
                            <p className='text-xs text-gray-600 mb-4'>Enter your body measurements to calculate your Fit Confidence Score (0–100) and unlock Free Exchange Insurance if needed.</p>
                            
                            <div className='grid grid-cols-2 gap-3 mb-4'>
                                <div className='col-span-2'>
                                    <label className='block text-[10px] font-semibold text-gray-600 uppercase mb-1'>Gender Profile</label>
                                    <select value={gender} onChange={(e) => setGender(e.target.value)} className='border border-gray-300 rounded px-2.5 py-1.5 w-full text-xs outline-none focus:border-black'>
                                        <option value="Men">Men</option>
                                        <option value="Women">Women</option>
                                    </select>
                                </div>
                                <div>
                                    <label className='block text-[10px] font-semibold text-gray-600 uppercase mb-1'>Height (cm)</label>
                                    <input type="number" placeholder="175" value={height} onChange={(e) => setHeight(e.target.value)} className='border border-gray-300 rounded px-2.5 py-1.5 w-full text-xs outline-none focus:border-black' />
                                </div>
                                <div>
                                    <label className='block text-[10px] font-semibold text-gray-600 uppercase mb-1'>Weight (kg)</label>
                                    <input type="number" placeholder="70" value={weight} onChange={(e) => setWeight(e.target.value)} className='border border-gray-300 rounded px-2.5 py-1.5 w-full text-xs outline-none focus:border-black' />
                                </div>
                                <div>
                                    <label className='block text-[10px] font-semibold text-gray-600 uppercase mb-1'>Waist (in, optional)</label>
                                    <input type="number" placeholder="32" value={waist} onChange={(e) => setWaist(e.target.value)} className='border border-gray-300 rounded px-2.5 py-1.5 w-full text-xs outline-none focus:border-black' />
                                </div>
                                <div>
                                    <label className='block text-[10px] font-semibold text-gray-600 uppercase mb-1'>Chest (in, optional)</label>
                                    <input type="number" placeholder="38" value={chest} onChange={(e) => setChest(e.target.value)} className='border border-gray-300 rounded px-2.5 py-1.5 w-full text-xs outline-none focus:border-black' />
                                </div>
                            </div>
                            
                            <button 
                                type="button" 
                                disabled={loadingScore} 
                                onClick={checkFitScores} 
                                className='w-full bg-black hover:bg-gray-800 text-white text-xs font-semibold py-2 rounded transition cursor-pointer flex justify-center items-center gap-2'
                            >
                                {loadingScore ? "Calculating..." : "Assess Return Risk"}
                            </button>

                            {Object.keys(fitAssessments).length > 0 && (
                                <div className='mt-5 pt-4 border-t border-gray-200 flex flex-col gap-4'>
                                    <h4 className='text-xs font-bold text-gray-700 uppercase tracking-wide'>Risk Scorecard:</h4>
                                    {orderItems.map((item) => {
                                        const key = `${item._id}_${item.size}`;
                                        const assessment = fitAssessments[key];
                                        if (!assessment) return null;
                                        
                                        const score = assessment.fitScore;
                                        let scoreColor = "text-green-600 bg-green-50 border-green-200";
                                        let scoreText = "Perfect Fit Confidence";
                                        
                                        if (score < 60) {
                                            scoreColor = "text-red-600 bg-red-50 border-red-200 animate-pulse";
                                            scoreText = "High Return Risk! (Size Anxiety Interventions Applied)";
                                        } else if (score < 75) {
                                            scoreColor = "text-yellow-600 bg-yellow-50 border-yellow-200";
                                            scoreText = "Moderate Return Risk";
                                        }
                                        
                                        return (
                                            <div key={key} className='border rounded p-3 bg-gray-50 flex flex-col gap-2'>
                                                <div className='flex justify-between items-start'>
                                                    <div>
                                                        <p className='text-xs font-bold text-gray-800'>{item.name}</p>
                                                        <p className='text-[10px] text-gray-500'>Size: {item.size} | Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className={`text-center px-2 py-1 border rounded font-bold text-xs ${scoreColor}`}>
                                                        {score}% Fit Score
                                                    </div>
                                                </div>
                                                <p className='text-[10px] text-gray-600 font-medium italic'>{scoreText}</p>
                                                
                                                {/* Celebrity Twin */}
                                                <div className='bg-blue-50 border border-blue-200 rounded p-2 text-[10px] text-blue-900 mt-1 shadow-xs'>
                                                    <span className='font-bold'>👥 Celebrity Fit Twin:</span>
                                                    <p className='mt-0.5 text-gray-700'>
                                                      Matched with <strong>{assessment.celebMatch.name}</strong> ({assessment.celebMatch.height}, {assessment.celebMatch.weight}) wearing <strong>Size {assessment.celebMatch.size}</strong>.
                                                    </p>
                                                    {assessment.sizeMismatch === 1 && (
                                                      <p className='mt-1 text-red-600 font-semibold'>
                                                        💡 Recommended Size: Size {assessment.idealSize}
                                                      </p>
                                                    )}
                                                </div>

                                                {/* Interventions */}
                                                {score < 60 && (
                                                    <div className='flex flex-col gap-2 mt-1.5 pt-2 border-t border-gray-200'>
                                                        <div className='bg-green-50 border border-green-200 rounded p-2 text-[9px] text-green-950 flex items-start gap-1.5 shadow-xs'>
                                                            <span>🛡️</span>
                                                            <div>
                                                                <span className='font-bold'>Free Exchange Insurance Activated</span>
                                                                <p className='text-gray-600 mt-0.5'>All return shipping and exchange fees are 100% free for this item.</p>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className='bg-orange-50 border border-orange-200 rounded p-2 text-[9px] text-orange-950 flex flex-col gap-1.5 shadow-xs'>
                                                            <div>
                                                              <span className='font-bold'>📦 Try Two Sizes Option:</span>
                                                              <p className='text-gray-600 mt-0.5'>
                                                                Add both Size {item.size} and Size {assessment.idealSize} to compare them at home. Return the wrong one for free.
                                                              </p>
                                                            </div>
                                                            <button 
                                                              type="button" 
                                                              onClick={() => addToCart(item._id, assessment.idealSize)}
                                                              className='bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-bold py-0.5 px-2 rounded w-max transition'
                                                            >
                                                              + Add Size {assessment.idealSize}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : null;
                })()}

                <div className='mt-12'>
                    <Title text1={'PAYMENT'} text2={'METHOD'} />
                    {/* --------------- Payment Method Selection ------------- */}
                    <div className='flex gap-3 flex-col lg:flex-row'>
                        <div onClick={() => setMethod('stripe')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'stripe' ? 'bg-green-400' : ''}`}></p>
                            <img className='h-5 mx-4' src={assets.stripe_logo} alt="" />
                        </div>
                        <div onClick={() => setMethod('razorpay')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'razorpay' ? 'bg-green-400' : ''}`}></p>
                            <img className='h-5 mx-4' src={assets.razorpay_logo} alt="" />
                        </div>
                        <div onClick={() => setMethod('cod')} className='flex items-center gap-3 border p-2 px-3 cursor-pointer'>
                            <p className={`min-w-3.5 h-3.5 border rounded-full ${method === 'cod' ? 'bg-green-400' : ''}`}></p>
                            <p className='text-gray-500 text-sm font-medium mx-4'>CASH ON DELIVERY</p>
                        </div>
                    </div>

                    <div className='mt-8'>
                        <TrustBadges currentAmount={getCartAmount()} freeShippingThreshold={100} currency={currency} />
                    </div>

                    <div className='w-full flex flex-wrap justify-end gap-3 mt-6'>
                        <button 
                            type='button' 
                            onClick={() => {
                                if (!formData.firstName || !formData.email || !formData.street) {
                                    toast.error("Please fill in delivery information first.");
                                    return;
                                }
                                setShowSleepShop(true);
                            }}
                            className='bg-gradient-to-r from-indigo-700 to-indigo-900 hover:from-indigo-800 hover:to-indigo-950 text-white px-6 py-3.5 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-2 cursor-pointer'
                        >
                            <span>🌙</span>
                            <span>Sleep & Shop (Deferred Purchase)</span>
                        </button>
                        <button type='submit' className='bg-black hover:bg-gray-800 text-white px-10 py-3.5 text-xs font-bold uppercase tracking-wider rounded-xl transition shadow-md cursor-pointer'>
                            PLACE ORDER NOW
                        </button>
                    </div>
                </div>
            </div>

            {/* Sleep & Shop Modal */}
            <SleepShopModal
                isOpen={showSleepShop}
                onClose={() => setShowSleepShop(false)}
                orderData={{
                    address: formData,
                    items: (() => {
                        let orderItems = [];
                        for (const items in cartItems) {
                            for (const item in cartItems[items]) {
                                if (cartItems[items][item] > 0) {
                                    const itemInfo = structuredClone(products.find(product => product._id === items));
                                    if (itemInfo) {
                                        itemInfo.size = item;
                                        itemInfo.quantity = cartItems[items][item];
                                        orderItems.push(itemInfo);
                                    }
                                }
                            }
                        }
                        return orderItems;
                    })(),
                    amount: getCartAmount() + delivery_fee,
                    paymentMethod: method
                }}
            />
        </form>
    )
}

export default PlaceOrder
