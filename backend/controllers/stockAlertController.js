import stockAlertModel from "../models/stockAlertModel.js";
import productModel from "../models/productModel.js";
import notificationModel from "../models/notificationModel.js";
import deferredOrderModel from "../models/deferredOrderModel.js";

// Subscribe to Back in Stock Alert
const subscribeStockAlert = async (req, res) => {
    try {
        const { userId, email, productId, size } = req.body;

        if (!email || !productId) {
            return res.json({ success: false, message: "Email and Product ID are required" });
        }

        const product = await productModel.findById(productId);
        const productName = product ? product.name : "Product";
        const productImage = product && product.image && product.image[0] ? product.image[0] : "";

        // Check if already subscribed
        const existing = await stockAlertModel.find({
            where: {
                email,
                productId,
                size: size || null,
                status: 'pending'
            }
        });

        if (existing && existing.length > 0) {
            return res.json({ success: true, message: "You are already on the priority restock waitlist for this item!" });
        }

        const newAlert = new stockAlertModel({
            userId: userId || null,
            email,
            productId,
            productName,
            productImage,
            size: size || null,
            status: 'pending',
            date: Date.now()
        });
        await newAlert.save();

        if (userId) {
            await notificationModel.create({
                userId,
                title: "🔔 Restock Alert Activated",
                message: `You will be notified immediately the moment "${productName}" ${size ? `(Size ${size})` : ''} returns to stock.`,
                type: 'stock_alert',
                data: { productId, size },
                date: Date.now()
            });
        }

        res.json({
            success: true,
            message: `Priority restock alert set for ${productName}! We'll notify you as soon as it arrives.`,
            alert: newAlert
        });

    } catch (error) {
        console.error("Error subscribing to stock alert:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get active stock alerts for logged-in user
const getUserStockAlerts = async (req, res) => {
    try {
        const { userId } = req.body;
        const alerts = await stockAlertModel.find({ userId });
        res.json({ success: true, alerts });
    } catch (error) {
        console.error("Error getting stock alerts:", error);
        res.json({ success: false, message: error.message });
    }
};

// Trigger Restock (Can be called by Admin or webhook or simulation)
const triggerRestock = async (req, res) => {
    try {
        const { productId, size } = req.body;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Find pending subscribers
        const alerts = await stockAlertModel.find({
            where: {
                productId,
                status: 'pending'
            }
        });

        let notifiedCount = 0;
        for (const alert of alerts) {
            if (!size || !alert.size || alert.size === size) {
                await stockAlertModel.findByIdAndUpdate(alert._id, { status: 'notified' });

                if (alert.userId) {
                    await notificationModel.create({
                        userId: alert.userId,
                        title: "🎉 BACK IN STOCK ALERT!",
                        message: `Great news! "${product.name}" ${alert.size ? `in Size ${alert.size}` : ''} is now back in stock. Grab yours before it sells out again!`,
                        type: 'stock_alert',
                        data: { productId: product._id, size: alert.size },
                        date: Date.now()
                    });
                }
                notifiedCount++;
            }
        }

        // Check if there are any restock-conditioned Sleep & Shop orders
        const deferredOrders = await deferredOrderModel.find({
            where: {
                status: 'scheduled',
                triggerCondition: 'restock'
            }
        });

        for (const deferred of deferredOrders) {
            const hasMatchingProduct = (deferred.items || []).some(item => 
                (item._id === productId || item.id === productId) && (!size || item.size === size)
            );
            if (hasMatchingProduct) {
                // Trigger instant execution
                await deferredOrderModel.findByIdAndUpdate(deferred._id, { scheduledExecutionTime: Date.now() - 1000 });
            }
        }

        res.json({
            success: true,
            message: `Restock alert processed! ${notifiedCount} subscriber(s) notified.`,
            notifiedCount
        });

    } catch (error) {
        console.error("Error triggering restock alert:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get User In-App Notifications
const getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.body;
        const notifications = await notificationModel.find({ userId });
        const sorted = (notifications || []).sort((a, b) => b.date - a.date);
        const unreadCount = sorted.filter(n => !n.read).length;

        res.json({
            success: true,
            notifications: sorted,
            unreadCount
        });
    } catch (error) {
        console.error("Error getting notifications:", error);
        res.json({ success: false, message: error.message });
    }
};

// Mark Notification as Read
const markNotificationRead = async (req, res) => {
    try {
        const { userId, notificationId } = req.body;

        if (notificationId === 'all') {
            await notificationModel.update({ read: true }, { where: { userId } });
            return res.json({ success: true, message: "All notifications marked as read" });
        }

        await notificationModel.findByIdAndUpdate(notificationId, { read: true });
        res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        console.error("Error updating notification:", error);
        res.json({ success: false, message: error.message });
    }
};

export {
    subscribeStockAlert,
    getUserStockAlerts,
    triggerRestock,
    getUserNotifications,
    markNotificationRead
};
