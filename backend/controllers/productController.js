import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"
import priceHistoryModel from "../models/priceHistoryModel.js"
import priceAlertModel from "../models/priceAlertModel.js"
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, sizeChart } = req.body

        const image1 = req.files.image1 && req.files.image1[0]
        const image2 = req.files.image2 && req.files.image2[0]
        const image3 = req.files.image3 && req.files.image3[0]
        const image4 = req.files.image4 && req.files.image4[0]

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined)

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url
            })
        )

        const productData = {
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true" ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            date: Date.now(),
            sizeChart: sizeChart ? JSON.parse(sizeChart) : null
        }

        console.log(productData);

        const product = new productModel(productData);
        await product.save();

        // Log initial price history
        await priceHistoryModel.create({
            productId: product._id,
            price: product.price,
            date: Date.now()
        });

        res.json({ success: true, message: "Product Added" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for list product
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({});
        res.json({success:true,products})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for removing product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function for single product info
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// function to update product price (for testing/admin update)
const updatePrice = async (req, res) => {
    try {
        const { productId, newPrice } = req.body;
        if (!productId || newPrice === undefined) {
            return res.json({ success: false, message: "Missing product ID or price" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        product.price = Number(newPrice);
        await product.save();

        // Log new price history
        await priceHistoryModel.create({
            productId: product._id,
            price: product.price,
            date: Date.now()
        });

        // Check alerts
        const alerts = await priceAlertModel.find({ productId, isActive: true });
        const triggeredAlerts = [];

        for (const alert of alerts) {
            if (product.price <= alert.targetPrice) {
                alert.isActive = false; // Mark alert as triggered
                await alert.save();
                
                // Simulate sending email/push notification
                console.log(`[Price Drop Alert] User ${alert.userId}: ${product.name} is now ${product.price} (Target: ${alert.targetPrice})`);
                triggeredAlerts.push(alert);
            }
        }

        res.json({ 
            success: true, 
            message: "Price updated successfully", 
            newPrice: product.price,
            alertsTriggered: triggeredAlerts.length 
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// function for updating product details
const updateProduct = async (req, res) => {
    try {
        const { id, name, description, price, category, subCategory, sizes, bestseller, existingImages } = req.body;

        const product = await productModel.findById(id);
        if (!product) {
            return res.json({ success: false, message: "Product not found" });
        }

        // Check if price changed
        const oldPrice = product.price;
        const newPrice = price !== undefined ? Number(price) : oldPrice;

        // Upload new images if any
        let newImages = [];
        if (req.files) {
            const image1 = req.files.image1 && req.files.image1[0];
            const image2 = req.files.image2 && req.files.image2[0];
            const image3 = req.files.image3 && req.files.image3[0];
            const image4 = req.files.image4 && req.files.image4[0];

            const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

            newImages = await Promise.all(
                images.map(async (item) => {
                    let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                    return result.secure_url;
                })
            );
        }

        // Determine final image list
        let finalImages = product.image;
        if (newImages.length > 0) {
            finalImages = newImages; // Replace with new uploads if provided
        } else if (existingImages) {
            try {
                finalImages = JSON.parse(existingImages);
            } catch (e) {
                // If it's already an array/object, use it
                if (Array.isArray(existingImages)) {
                    finalImages = existingImages;
                }
            }
        }

        // Update properties
        if (name) product.name = name;
        if (description) product.description = description;
        if (price !== undefined) product.price = newPrice;
        if (category) product.category = category;
        if (subCategory) product.subCategory = subCategory;
        if (sizes) {
            try {
                product.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
            } catch (e) {
                product.sizes = sizes;
            }
        }
        if (bestseller !== undefined) {
            product.bestseller = bestseller === "true" || bestseller === true;
        }
        product.image = finalImages;

        await product.save();

        // If price is updated, log it and trigger alerts
        if (newPrice !== oldPrice) {
            await priceHistoryModel.create({
                productId: product._id,
                price: newPrice,
                date: Date.now()
            });

            // Check and trigger alerts
            const alerts = await priceAlertModel.find({ productId: product._id, isActive: true });
            for (const alert of alerts) {
                if (newPrice <= alert.targetPrice) {
                    alert.isActive = false;
                    await alert.save();
                    console.log(`[Price Drop Alert] User ${alert.userId}: ${product.name} is now ${product.price} (Target: ${alert.targetPrice})`);
                }
            }
        }

        res.json({ success: true, message: "Product updated successfully" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const reverseSearch = async (req, res) => {
    try {
        if (!req.file) {
            return res.json({ success: false, message: "No image file provided" })
        }

        const uploadedFilePath = req.file.path

        // Fetch all products from DB
        const products = await productModel.find({})
        
        // Map to light payload
        const productData = products.map(p => ({
            _id: p._id,
            image: p.image
        }))

        // Write to temp file
        const tempJsonPath = path.join(__dirname, "../scripts/temp_products.json")
        fs.writeFileSync(tempJsonPath, JSON.stringify(productData))

        // Invoke python script
        const pythonScriptPath = path.join(__dirname, "../scripts/reverse_search.py")
        
        const pythonProcess = spawn('python', [pythonScriptPath, uploadedFilePath, tempJsonPath])

        let stdoutData = ''
        let stderrData = ''

        pythonProcess.stdout.on('data', (data) => {
            stdoutData += data.toString()
        })

        pythonProcess.stderr.on('data', (data) => {
            stderrData += data.toString()
        })

        pythonProcess.on('close', async (code) => {
            // Clean up temp files
            try {
                if (fs.existsSync(uploadedFilePath)) fs.unlinkSync(uploadedFilePath)
            } catch (e) {
                console.error("Clean up upload failed:", e.message)
            }
            try {
                if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath)
            } catch (e) {
                console.error("Clean up temp JSON failed:", e.message)
            }

            if (code !== 0) {
                console.error(`Python script exited with code ${code}. Error: ${stderrData}`)
                return res.json({ success: false, message: "Visual matching engine failed: " + stderrData })
            }

            try {
                const result = JSON.parse(stdoutData.trim())
                if (!result.success) {
                    return res.json({ success: false, message: result.error || "Feature extraction failed" })
                }

                // Map matches back to products
                const matchScores = {}
                result.matches.forEach(m => {
                    matchScores[m.productId] = m.score
                })

                // Get products that are matches with similarity score > threshold
                const matchedProductIds = result.matches
                    .filter(m => m.score > 0.1) // Keep threshold relaxed to show best options
                    .map(m => m.productId)

                // Retrieve full product info
                const allMatchedProducts = products.filter(p => matchedProductIds.includes(p._id.toString()))
                
                // Sort by similarity score descending
                allMatchedProducts.sort((a, b) => {
                    return (matchScores[b._id.toString()] || 0) - (matchScores[a._id.toString()] || 0)
                })

                res.json({
                    success: true,
                    mode: result.mode,
                    products: allMatchedProducts
                })

            } catch (err) {
                console.error("Parse result failed:", err.message, "Output was:", stdoutData)
                res.json({ success: false, message: "Failed to parse matching results: " + err.message })
            }
        })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { listProducts, addProduct, removeProduct, singleProduct, updatePrice, updateProduct, reverseSearch }