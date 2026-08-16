import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from 'stripe'
import razorpay from 'razorpay'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// global variables
const currency = 'inr'
const deliveryCharge = 10

// gateway initialize
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('---')) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

let razorpayInstance = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && 
    !process.env.RAZORPAY_KEY_ID.includes('Paste') && !process.env.RAZORPAY_KEY_SECRET.includes('Paste')) {
    razorpayInstance = new razorpay({
        key_id : process.env.RAZORPAY_KEY_ID,
        key_secret : process.env.RAZORPAY_KEY_SECRET,
    })
}

// Placing orders using COD Method
const placeOrder = async (req,res) => {
    
    try {
        
        const { userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"COD",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        await userModel.findByIdAndUpdate(userId,{cartData:{}})

        res.json({success:true,message:"Order Placed"})


    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Stripe Method
const placeOrderStripe = async (req,res) => {
    try {
        
        const { userId, items, amount, address} = req.body
        const { origin } = req.headers;

        if (!stripe) {
            return res.json({success:false, message: 'Stripe not configured'})
        }

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Stripe",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data: {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data: {
                currency:currency,
                product_data: {
                    name:'Delivery Charges'
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment',
        })

        res.json({success:true,session_url:session.url});

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Verify Stripe 
const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        if (success === "true") {
            await orderModel.findByIdAndUpdate(orderId, {payment:true});
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        } else {
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }
        
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// Placing orders using Razorpay Method
const placeOrderRazorpay = async (req,res) => {
    try {
        
        const { userId, items, amount, address} = req.body

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:"Razorpay",
            payment:false,
            date: Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()

        const options = {
            amount: amount * 100,
            currency: currency.toUpperCase(),
            receipt : newOrder._id.toString()
        }

        await razorpayInstance.orders.create(options, (error,order)=>{
            if (error || !razorpayInstance) {
                console.log(error || 'Razorpay not configured')
                return res.json({success:false, message: error || 'Razorpay not configured'})
            }
            res.json({success:true,order})
        })

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

const verifyRazorpay = async (req,res) => {
    try {
        
        const { userId, razorpay_order_id  } = req.body

        if (!razorpayInstance) {
            return res.json({ success: false, message: 'Razorpay not configured' })
        }

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id)
        if (orderInfo.status === 'paid') {
            await orderModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            await userModel.findByIdAndUpdate(userId,{cartData:{}})
            res.json({ success: true, message: "Payment Successful" })
        } else {
             res.json({ success: false, message: 'Payment Failed' });
        }

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}


// All Orders data for Admin Panel
const allOrders = async (req,res) => {

    try {
        
        const orders = await orderModel.find({})
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

// User Order Data For Forntend
const userOrders = async (req,res) => {
    try {
        
        const { userId } = req.body

        const orders = await orderModel.find({ userId })
        res.json({success:true,orders})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// update order status from Admin Panel
const updateStatus = async (req,res) => {
    try {
        
        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({success:true,message:'Status Updated'})

    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// Calculate return risk score (Size Anxiety Index)
const calculateFitRisk = async (req, res) => {
    try {
        const { userId, height, weight, waist, chest, selectedSize, productId, gender = 'Men' } = req.body

        if (!productId || !selectedSize || !height || !weight) {
            return res.json({ success: false, message: "Missing required fields (productId, selectedSize, height, weight)" })
        }

        const product = await productModel.findById(productId)
        if (!product) {
            return res.json({ success: false, message: "Product not found" })
        }

        // 1. Calculate User Return Rate
        const userOrders = await orderModel.find({ userId })
        let userReturnRate = 0.1 // baseline
        if (userOrders && userOrders.length > 0) {
            const returnedOrders = userOrders.filter(o => o.status === 'Returned' || o.status === 'returned')
            userReturnRate = returnedOrders.length / userOrders.length
        }

        // 2. Calculate Product Return Rate
        const allOrdersList = await orderModel.find({})
        let productOrdersCount = 0
        let productReturnsCount = 0
        
        allOrdersList.forEach(order => {
            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item._id === productId || item.id === productId) {
                        productOrdersCount++
                        if (order.status === 'Returned' || order.status === 'returned') {
                            productReturnsCount++
                        }
                    }
                })
            }
        })
        
        let productReturnRate = 0.12 // default category fallback
        if (product.category === 'Women') productReturnRate = 0.15
        if (product.subCategory === 'Bottomwear') productReturnRate = 0.16
        if (productOrdersCount > 0) {
            productReturnRate = productReturnsCount / productOrdersCount
        }

        // 3. Determine Ideal Size and Deviation (Measurement Error)
        let idealSize = 'M'
        const wVal = Number(weight)
        const hVal = Number(height)

        if (gender === 'Women' || product.category === 'Women') {
            if (wVal < 50) idealSize = 'S'
            else if (wVal >= 50 && wVal < 62) idealSize = 'M'
            else if (wVal >= 62 && wVal < 75) idealSize = 'L'
            else idealSize = 'XL'
        } else {
            // Men or general
            if (wVal < 60) idealSize = 'S'
            else if (wVal >= 60 && wVal < 73) idealSize = 'M'
            else if (wVal >= 73 && wVal < 85) idealSize = 'L'
            else if (wVal >= 85 && wVal < 97) idealSize = 'XL'
            else idealSize = 'XXL'
        }

        // Standard Sizing Chart maps
        const sizeChart = {
            'S': { chest: 36, waist: 30 },
            'M': { chest: 38, waist: 32 },
            'L': { chest: 40, waist: 34 },
            'XL': { chest: 42, waist: 36 },
            'XXL': { chest: 44, waist: 38 }
        }
        if (gender === 'Women' || product.category === 'Women') {
            sizeChart['S'] = { chest: 34, waist: 26 }
            sizeChart['M'] = { chest: 36, waist: 28 }
            sizeChart['L'] = { chest: 38, waist: 30 }
            sizeChart['XL'] = { chest: 40, waist: 32 }
        }

        let sizeMismatch = selectedSize !== idealSize ? 1 : 0
        let measurementError = 0.0

        if (chest && sizeChart[selectedSize]) {
            measurementError += Math.abs(Number(chest) - sizeChart[selectedSize].chest)
        }
        if (waist && sizeChart[selectedSize]) {
            measurementError += Math.abs(Number(waist) - sizeChart[selectedSize].waist)
        }

        // If no chest/waist details were provided, approximate deviation based on mismatch
        if (!chest && !waist) {
            if (sizeMismatch) {
                // Approximate 2 size levels error
                measurementError = 3.0
            } else {
                measurementError = 0.5
            }
        }

        // 4. Calculate Risk Probability using Model Coefficients
        let coefs = {
            intercept: -3.42,
            coef_user_return_rate: 2.87,
            coef_product_return_rate: 3.92,
            coef_measurement_error: 0.38,
            coef_size_mismatch: 1.15
        }

        try {
            const coefFile = path.join(__dirname, "../scripts/fit_model_coef.json")
            if (fs.existsSync(coefFile)) {
                coefs = JSON.parse(fs.readFileSync(coefFile, 'utf8'))
            }
        } catch (e) {
            console.error("Failed to read coefficients file, using default:", e.message)
        }

        const logit = coefs.intercept + 
                      (coefs.coef_user_return_rate * userReturnRate) + 
                      (coefs.coef_product_return_rate * productReturnRate) + 
                      (coefs.coef_measurement_error * measurementError) + 
                      (coefs.coef_size_mismatch * sizeMismatch)

        const P = 1 / (1 + Math.exp(-logit))
        const fitScore = Math.max(5, Math.min(99, Math.round((1 - P) * 100)))

        // 5. Select Celebrity Sizing Twin
        let celebMatch = { name: "Zac Efron", height: "173cm", weight: "75kg", size: "M" }
        if (gender === 'Women' || product.category === 'Women') {
            if (hVal < 162) {
                celebMatch = { name: "Ariana Grande", height: "155cm", weight: "49kg", size: "XS/S" }
            } else if (hVal >= 162 && hVal < 172) {
                celebMatch = { name: "Scarlett Johansson", height: "160cm", weight: "57kg", size: "M" }
            } else {
                celebMatch = { name: "Zendaya", height: "178cm", weight: "55kg", size: "S" }
            }
        } else {
            // Men
            if (hVal < 172) {
                celebMatch = { name: "Tom Holland", height: "170cm", weight: "68kg", size: "M" }
            } else if (hVal >= 172 && hVal < 182) {
                celebMatch = { name: "Zac Efron", height: "173cm", weight: "75kg", size: "M" }
            } else {
                celebMatch = { name: "Chris Hemsworth", height: "190cm", weight: "91kg", size: "XL" }
            }
        }

        res.json({
            success: true,
            fitScore,
            userReturnRate: Math.round(userReturnRate * 100) / 100,
            productReturnRate: Math.round(productReturnRate * 100) / 100,
            sizeMismatch,
            idealSize,
            celebMatch,
            interventionsRequired: fitScore < 60
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export {verifyRazorpay, verifyStripe ,placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus, calculateFitRisk}