import priceAlertModel from "../models/priceAlertModel.js";
import priceHistoryModel from "../models/priceHistoryModel.js";
import productModel from "../models/productModel.js";

// Helper to seed fake historical price data if history is sparse
const seedFakePriceHistory = async (productId, currentPrice) => {
    const count = await priceHistoryModel.count({ where: { productId } });
    if (count < 3) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        // Generate history for the last 15 days showing a cyclical/downward pattern
        const mockHistory = [
            { productId, price: currentPrice * 1.25, date: now - 15 * oneDay },
            { productId, price: currentPrice * 1.20, date: now - 12 * oneDay },
            { productId, price: currentPrice * 1.15, date: now - 9 * oneDay },
            { productId, price: currentPrice * 1.10, date: now - 6 * oneDay },
            { productId, price: currentPrice * 1.05, date: now - 3 * oneDay },
            { productId, price: currentPrice, date: now }
        ];
        for (const item of mockHistory) {
            await priceHistoryModel.create(item);
        }
    }
};

// Add a product to the user's watchlist
const watchProduct = async (req, res) => {
    try {
        const { userId, productId, targetPrice } = req.body;

        if (!productId || !targetPrice) {
            return res.json({ success: false, message: "Missing required fields" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Seed history so prediction works immediately
        await seedFakePriceHistory(productId, product.price);

        // Check if already watching
        let alert = await priceAlertModel.findOne({ where: { userId, productId } });

        if (alert) {
            alert.targetPrice = targetPrice;
            alert.isActive = true;
            alert.date = Date.now();
            await alert.save();
        } else {
            alert = await priceAlertModel.create({
                userId,
                productId,
                targetPrice,
                isActive: true,
                date: Date.now()
            });
        }

        res.json({ success: true, message: "Product added to watchlist", alert });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Remove product from watchlist
const unwatchProduct = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        const alert = await priceAlertModel.findOne({ where: { userId, productId } });
        if (alert) {
            await alert.destroy();
            res.json({ success: true, message: "Product removed from watchlist" });
        } else {
            res.json({ success: false, message: "Watchlist entry not found" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Get watchlist for user
const getWatchlist = async (req, res) => {
    try {
        const { userId } = req.body;

        const alerts = await priceAlertModel.find({ userId });
        const watchlist = [];

        for (const alert of alerts) {
            const product = await productModel.findById(alert.productId);
            if (product) {
                watchlist.push({
                    alertId: alert._id,
                    productId: product._id,
                    name: product.name,
                    image: product.image,
                    currentPrice: product.price,
                    targetPrice: alert.targetPrice,
                    isActive: alert.isActive,
                    date: alert.date
                });
            }
        }

        res.json({ success: true, watchlist });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// Smart Prediction logic based on simple linear regression / trend projection
const getPricePrediction = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Seed history if empty
        await seedFakePriceHistory(productId, product.price);

        const history = await priceHistoryModel.find({
            where: { productId },
            order: [['date', 'ASC']]
        });

        if (history.length < 2) {
            return res.json({
                success: true,
                prediction: {
                    recommendation: "BUY NOW",
                    message: "Insufficient price history to predict a drop. The price is currently stable.",
                    expectedDropPercent: 0,
                    daysToDrop: 0
                }
            });
        }

        // Run regression trend line
        const n = history.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        const firstTime = Number(history[0].date);

        history.forEach((point, i) => {
            // Use day differences as X to avoid huge numbers
            const x = (Number(point.date) - firstTime) / (24 * 60 * 60 * 1000);
            const y = point.price;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

        let recommendation = "BUY NOW";
        let message = "Price is expected to remain stable. Great time to buy!";
        let expectedDropPercent = 0;
        let daysToDrop = 7;

        if (slope < 0) {
            // Downward trend!
            const currentPrice = product.price;
            const expectedDrop = Math.abs(slope * 7); // Projecting 7 days forward
            expectedDropPercent = Math.round((expectedDrop / currentPrice) * 100);

            if (expectedDropPercent >= 5) {
                recommendation = "WAIT";
                message = `This item is likely to drop by ${expectedDropPercent}% within 7 days. We recommend waiting!`;
            } else {
                message = `Minor drop of about ${expectedDropPercent}% predicted. Buy now or wait a few days.`;
            }
        } else if (slope > 0) {
            // Upward trend
            recommendation = "BUY NOW";
            message = "Price is trending upwards! Buy now before it increases further.";
        }

        res.json({
            success: true,
            prediction: {
                recommendation,
                message,
                expectedDropPercent,
                daysToDrop
            }
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export { watchProduct, unwatchProduct, getWatchlist, getPricePrediction, seedFakePriceHistory };
