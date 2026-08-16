import deferredOrderModel from "../models/deferredOrderModel.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import notificationModel from "../models/notificationModel.js";

// Helper to calculate next midnight
const getNextMidnight = () => {
    const d = new Date();
    d.setHours(24, 0, 0, 0);
    return d.getTime();
};

// Create a deferred order (Sleep & Shop)
const createDeferredOrder = async (req, res) => {
    try {
        const { userId, items, amount, address, paymentMethod, triggerCondition, delayHours, triggerValue, notes } = req.body;

        if (!items || items.length === 0) {
            return res.json({ success: false, message: "Cart is empty" });
        }

        let scheduledExecutionTime = Date.now() + (Number(delayHours || 12) * 3600 * 1000);

        if (triggerCondition === 'midnight_flash_sale') {
            scheduledExecutionTime = getNextMidnight();
        } else if (triggerCondition === 'timer') {
            const hours = Number(delayHours) || 12;
            scheduledExecutionTime = Date.now() + (hours * 3600 * 1000);
        } else if (triggerCondition === 'price_drop') {
            // Default 7 days timeout for price drop auto-order
            scheduledExecutionTime = Date.now() + (7 * 24 * 3600 * 1000);
        } else if (triggerCondition === 'restock') {
            // Default 14 days timeout for restock auto-buy
            scheduledExecutionTime = Date.now() + (14 * 24 * 3600 * 1000);
        }

        const deferredOrderData = {
            userId,
            items,
            amount: Number(amount),
            address,
            paymentMethod: paymentMethod || 'cod',
            triggerCondition: triggerCondition || 'timer',
            triggerValue: triggerValue ? String(triggerValue) : null,
            scheduledExecutionTime,
            delayHours: Number(delayHours || 12),
            status: 'scheduled',
            notes: notes || 'Sleep & Shop Deferred Order',
            date: Date.now()
        };

        const newDeferredOrder = new deferredOrderModel(deferredOrderData);
        await newDeferredOrder.save();

        // Clear user's cart
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Add Notification
        const timeDesc = triggerCondition === 'midnight_flash_sale'
            ? 'at Midnight Flash Sale (12:00 AM)'
            : triggerCondition === 'price_drop'
            ? `when price drops to target (${triggerValue})`
            : `in ${delayHours || 12} hours`;

        await notificationModel.create({
            userId,
            title: "🌙 Sleep & Shop Order Scheduled",
            message: `Your purchase of ${items.length} item(s) ($${amount}) is scheduled to process ${timeDesc}. You can cancel or buy immediately anytime from your Vault.`,
            type: 'sleep_and_shop',
            data: { deferredOrderId: newDeferredOrder._id },
            date: Date.now()
        });

        res.json({
            success: true,
            message: "Purchase scheduled in Sleep & Shop Mode!",
            deferredOrder: newDeferredOrder
        });

    } catch (error) {
        console.error("Error creating deferred order:", error);
        res.json({ success: false, message: error.message });
    }
};

// Get all deferred orders for a user
const getUserDeferredOrders = async (req, res) => {
    try {
        const { userId } = req.body;
        const deferredOrders = await deferredOrderModel.find({ userId });
        
        // Sort latest first
        const sorted = (deferredOrders || []).sort((a, b) => b.date - a.date);

        res.json({ success: true, deferredOrders: sorted });
    } catch (error) {
        console.error("Error getting deferred orders:", error);
        res.json({ success: false, message: error.message });
    }
};

// Cancel a deferred order
const cancelDeferredOrder = async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        const order = await deferredOrderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: "Order not found" });
        }

        if (order.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        if (order.status !== 'scheduled') {
            return res.json({ success: false, message: `Cannot cancel order with status: ${order.status}` });
        }

        await deferredOrderModel.findByIdAndUpdate(orderId, { status: 'cancelled' });

        await notificationModel.create({
            userId,
            title: "🚫 Sleep & Shop Order Cancelled",
            message: `Your scheduled purchase for $${order.amount} was cancelled. No charges were made.`,
            type: 'sleep_and_shop',
            data: { deferredOrderId: orderId },
            date: Date.now()
        });

        res.json({ success: true, message: "Deferred order cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling deferred order:", error);
        res.json({ success: false, message: error.message });
    }
};

// Execute deferred order immediately
const executeDeferredOrderNow = async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        const deferred = await deferredOrderModel.findById(orderId);
        if (!deferred) {
            return res.json({ success: false, message: "Deferred order not found" });
        }

        if (deferred.userId !== userId) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        if (deferred.status !== 'scheduled') {
            return res.json({ success: false, message: `Order already ${deferred.status}` });
        }

        // Create actual order in orderModel
        const newOrder = new orderModel({
            userId: deferred.userId,
            items: deferred.items,
            amount: deferred.amount,
            address: deferred.address,
            paymentMethod: deferred.paymentMethod,
            payment: deferred.paymentMethod === 'cod' ? false : true,
            status: 'Order Placed',
            date: Date.now()
        });
        await newOrder.save();

        // Update deferred order status
        await deferredOrderModel.findByIdAndUpdate(orderId, { status: 'executed' });

        // Add Notification
        await notificationModel.create({
            userId: deferred.userId,
            title: "🎉 Order Executed Successfully!",
            message: `Your Sleep & Shop order of ${deferred.items.length} item(s) ($${deferred.amount}) has been placed into processing!`,
            type: 'sleep_and_shop',
            data: { orderId: newOrder._id },
            date: Date.now()
        });

        res.json({
            success: true,
            message: "Order placed immediately and moved to active processing!",
            order: newOrder
        });

    } catch (error) {
        console.error("Error executing deferred order:", error);
        res.json({ success: false, message: error.message });
    }
};

// Background cron processor for eligible deferred orders
const processEligibleDeferredOrders = async () => {
    try {
        const now = Date.now();
        const allScheduled = await deferredOrderModel.find({ status: 'scheduled' });

        for (const deferred of allScheduled) {
            if (Number(deferred.scheduledExecutionTime) <= now) {
                console.log(`[Sleep & Shop Scheduler] Executing deferred order ${deferred._id} for user ${deferred.userId}`);

                const newOrder = new orderModel({
                    userId: deferred.userId,
                    items: deferred.items,
                    amount: deferred.amount,
                    address: deferred.address,
                    paymentMethod: deferred.paymentMethod || 'cod',
                    payment: deferred.paymentMethod === 'cod' ? false : true,
                    status: 'Order Placed',
                    date: Date.now()
                });
                await newOrder.save();

                await deferredOrderModel.findByIdAndUpdate(deferred._id, { status: 'executed' });

                await notificationModel.create({
                    userId: deferred.userId,
                    title: "🌙 Sleep & Shop Auto-Purchase Completed",
                    message: `Your scheduled purchase for ${deferred.items.length} item(s) ($${deferred.amount}) completed its timer and has been confirmed!`,
                    type: 'sleep_and_shop',
                    data: { orderId: newOrder._id },
                    date: Date.now()
                });
            }
        }
    } catch (err) {
        console.error("[Sleep & Shop Scheduler Error]:", err.message);
    }
};

export {
    createDeferredOrder,
    getUserDeferredOrders,
    cancelDeferredOrder,
    executeDeferredOrderNow,
    processEligibleDeferredOrders
};
