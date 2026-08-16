import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');


import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mysql.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'
import priceAlertRouter from './routes/priceAlertRoute.js'
import deferredOrderRouter from './routes/deferredOrderRoute.js'
import stockAlertRouter from './routes/stockAlertRoute.js'
import { processEligibleDeferredOrders } from './controllers/deferredOrderController.js'

// App Config
const app = express()
const port = process.env.PORT || 4000
await connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors())

// api endpoints
app.use('/api/user',userRouter)
app.use('/api/product',productRouter)
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)
app.use('/api/alert',priceAlertRouter)
app.use('/api/deferred-order',deferredOrderRouter)
app.use('/api/stock-alert',stockAlertRouter)

// Periodic background runner for Sleep & Shop auto-processing
setInterval(() => {
    processEligibleDeferredOrders();
}, 30000); // Runs every 30 seconds

app.get('/',(req,res)=>{
    res.send("API Working")
})

app.listen(port, ()=> console.log('Server started on PORT : '+ port));

/*import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/mongodb.js';
import connectCloudinary from './config/cloudinary.js';
import userRouter from './routes/userRoute.js';
import productRouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import mongoose from 'mongoose';

dotenv.config();

// App Config
const app = express();
const port = process.env.PORT || 4000;

// Initialize connections
connectDB();
connectCloudinary();

// middlewares
app.use(express.json());
app.use(cors());

// api endpoints
app.use('/api/user', userRouter);
app.use('/api/product', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/order', orderRouter);

app.get('/', (req, res) => {
    res.send("API Working");
});

app.listen(port, () => console.log('Server started on PORT : ' + port));*/