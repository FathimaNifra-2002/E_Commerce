import express from 'express';
import {
    subscribeStockAlert,
    getUserStockAlerts,
    triggerRestock,
    getUserNotifications,
    markNotificationRead
} from '../controllers/stockAlertController.js';
import authUser from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const stockAlertRouter = express.Router();

// Public / User subscribe
stockAlertRouter.post('/subscribe', (req, res, next) => {
    // Optional auth: if token is passed, use authUser, else proceed
    if (req.headers.token) {
        return authUser(req, res, next);
    }
    next();
}, subscribeStockAlert);

// User alert list
stockAlertRouter.post('/user-alerts', authUser, getUserStockAlerts);

// Restock trigger (admin or public simulate)
stockAlertRouter.post('/trigger-restock', triggerRestock);

// In-app notifications
stockAlertRouter.post('/notifications', authUser, getUserNotifications);
stockAlertRouter.post('/notifications/read', authUser, markNotificationRead);

export default stockAlertRouter;
