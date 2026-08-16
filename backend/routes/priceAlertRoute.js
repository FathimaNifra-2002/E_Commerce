import express from 'express';
import { watchProduct, unwatchProduct, getWatchlist, getPricePrediction } from '../controllers/priceAlertController.js';
import authUser from '../middleware/auth.js';

const priceAlertRouter = express.Router();

priceAlertRouter.post('/watch', authUser, watchProduct);
priceAlertRouter.post('/unwatch', authUser, unwatchProduct);
priceAlertRouter.post('/watchlist', authUser, getWatchlist);
priceAlertRouter.get('/predict/:productId', getPricePrediction);

export default priceAlertRouter;
