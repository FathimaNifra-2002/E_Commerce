import express from 'express';
import {
    createDeferredOrder,
    getUserDeferredOrders,
    cancelDeferredOrder,
    executeDeferredOrderNow
} from '../controllers/deferredOrderController.js';
import authUser from '../middleware/auth.js';

const deferredOrderRouter = express.Router();

deferredOrderRouter.post('/create', authUser, createDeferredOrder);
deferredOrderRouter.post('/user-orders', authUser, getUserDeferredOrders);
deferredOrderRouter.post('/cancel', authUser, cancelDeferredOrder);
deferredOrderRouter.post('/execute-now', authUser, executeDeferredOrderNow);

export default deferredOrderRouter;
