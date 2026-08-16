import express from 'express'
import { listProducts, addProduct, removeProduct, singleProduct, updatePrice, updateProduct, reverseSearch } from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();

productRouter.post('/add',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),addProduct);
productRouter.post('/remove',adminAuth,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.post('/update-price',updatePrice);
productRouter.post('/update',adminAuth,upload.fields([{name:'image1',maxCount:1},{name:'image2',maxCount:1},{name:'image3',maxCount:1},{name:'image4',maxCount:1}]),updateProduct);
productRouter.get('/list',listProducts)
productRouter.post('/reverse-search', upload.single('image'), reverseSearch)

export default productRouter