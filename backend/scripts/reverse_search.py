import sys
import os
import json
import urllib.request
import math
from PIL import Image, ImageFilter
import numpy as np

# Cache file path
CACHE_PATH = os.path.join(os.path.dirname(__file__), "embeddings_cache.json")

def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_cache(cache):
    try:
        with open(CACHE_PATH, "w") as f:
            json.dump(cache, f)
    except Exception as e:
        sys.stderr.write(f"Error saving cache: {e}\n")

# Fallback descriptor: Spatial Color Histogram + Edge Histogram
def extract_fallback_features(img_path_or_url):
    try:
        # Load image (could be local path or URL)
        if img_path_or_url.startswith("http://") or img_path_or_url.startswith("https://"):
            req = urllib.request.Request(img_path_or_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                img = Image.open(response).convert("RGB")
        else:
            img = Image.open(img_path_or_url).convert("RGB")
        
        # Resize to standard size for consistency
        img = img.resize((150, 200))
        width, height = img.size
        
        # 1. Spatial HSV Color Histograms
        # Convert image to HSV
        img_hsv = img.convert("HSV")
        hsv_arr = np.array(img_hsv)
        
        # Split image into 3 vertical regions (Top, Mid, Bottom) representing shoulders, torso, legs
        r_height = height // 3
        regions = [
            hsv_arr[0:r_height, :, :],
            hsv_arr[r_height:2*r_height, :, :],
            hsv_arr[2*r_height:height, :, :]
        ]
        
        hist_features = []
        for reg in regions:
            # Multi-dimensional histogram for Hue (8 bins), Saturation (4 bins), Value (4 bins)
            h_bins = 8
            s_bins = 4
            v_bins = 4
            
            h_hist, _ = np.histogram(reg[:,:,0], bins=h_bins, range=(0, 256))
            s_hist, _ = np.histogram(reg[:,:,1], bins=s_bins, range=(0, 256))
            v_hist, _ = np.histogram(reg[:,:,2], bins=v_bins, range=(0, 256))
            
            # Normalize each histogram
            h_hist = h_hist / (np.sum(h_hist) + 1e-6)
            s_hist = s_hist / (np.sum(s_hist) + 1e-6)
            v_hist = v_hist / (np.sum(v_hist) + 1e-6)
            
            hist_features.extend(h_hist.tolist())
            hist_features.extend(s_hist.tolist())
            hist_features.extend(v_hist.tolist())
            
        # 2. Edge Direction Histogram (Texture)
        # Convert to grayscale, apply Sobel filters manually to avoid dependencies
        img_gray = img.convert("L")
        gray_arr = np.array(img_gray, dtype=np.float32)
        
        # Simple Sobel kernels
        sobel_x = np.array([[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], dtype=np.float32)
        sobel_y = np.array([[-1, -2, -1], [0, 0, 0], [1, 2, 1]], dtype=np.float32)
        
        # Compute gradients
        gx = np.zeros_like(gray_arr)
        gy = np.zeros_like(gray_arr)
        # Convolve manually (vectorized interior)
        gx[1:-1, 1:-1] = (
            -gray_arr[:-2, :-2] + gray_arr[:-2, 2:] 
            - 2*gray_arr[1:-1, :-2] + 2*gray_arr[1:-1, 2:] 
            - gray_arr[2:, :-2] + gray_arr[2:, 2:]
        )
        gy[1:-1, 1:-1] = (
            -gray_arr[:-2, :-2] - 2*gray_arr[:-2, 1:-1] - gray_arr[:-2, 2:] 
            + gray_arr[2:, :-2] + 2*gray_arr[2:, 1:-1] + gray_arr[2:, 2:]
        )
        
        magnitude = np.sqrt(gx**2 + gy**2)
        angle = np.arctan2(gy, gx) * (180 / np.pi)
        angle[angle < 0] += 360
        
        # Only build histogram for strong edges
        threshold = 30.0
        edge_angles = angle[magnitude > threshold]
        
        edge_hist, _ = np.histogram(edge_angles, bins=8, range=(0, 360))
        edge_hist = edge_hist / (np.sum(edge_hist) + 1e-6)
        
        # Combine spatial HSV and edge features
        features = hist_features + edge_hist.tolist()
        
        # Normalize full vector (L2 norm)
        features = np.array(features)
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm
            
        return features.tolist()
    except Exception as e:
        sys.stderr.write(f"Error extracting fallback features: {e}\n")
        return None

# Try to use CNN feature extraction if torch and torchvision are available
CNN_AVAILABLE = False
try:
    import torch
    import torchvision.transforms as transforms
    import torchvision.models as models
    
    # We will only load the CNN if the libraries are successfully imported
    CNN_AVAILABLE = True
except ImportError:
    pass

def extract_cnn_features(img_path_or_url):
    if not CNN_AVAILABLE:
        return None
    try:
        # Define standard ImageNet transform
        transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        if img_path_or_url.startswith("http://") or img_path_or_url.startswith("https://"):
            req = urllib.request.Request(img_path_or_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                img = Image.open(response).convert("RGB")
        else:
            img = Image.open(img_path_or_url).convert("RGB")
            
        tensor = transform(img).unsqueeze(0)
        
        # Use simple ResNet-18 (load weights safely)
        # Using ResNet18_Weights or fallback if old torchvision version
        try:
            weights = models.ResNet18_Weights.DEFAULT
            model = models.resnet18(weights=weights)
        except AttributeError:
            model = models.resnet18(pretrained=True)
            
        model.eval()
        
        # Hook or slice to extract features before FC layer
        # ResNet18 output is 512 dimensions from the avgpool layer
        feature_extractor = torch.nn.Sequential(*(list(model.children())[:-1]))
        
        with torch.no_grad():
            features = feature_extractor(tensor)
            features = features.squeeze().numpy()
            
        # L2 Normalize
        norm = np.linalg.norm(features)
        if norm > 0:
            features = features / norm
        return features.tolist()
    except Exception as e:
        sys.stderr.write(f"Error extracting CNN features: {e}\n")
        return None

def compute_similarity(vec1, vec2):
    # Cosine similarity for normalized vectors is just the dot product
    return float(np.dot(vec1, vec2))

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Missing arguments. Usage: python reverse_search.py <target_image_path> <products_json_path>"}))
        return
        
    target_img_path = sys.argv[1]
    products_json_path = sys.argv[2]
    
    if not os.path.exists(target_img_path):
        print(json.dumps({"error": f"Target image not found at {target_img_path}"}))
        return
        
    if not os.path.exists(products_json_path):
        print(json.dumps({"error": f"Products JSON not found at {products_json_path}"}))
        return
        
    try:
        with open(products_json_path, "r") as f:
            products_list = json.load(f)
    except Exception as e:
        print(json.dumps({"error": f"Failed to parse products JSON: {e}"}))
        return

    cache = load_cache()
    
    # Decide which feature extractor to use
    # If CNN is available, try CNN first. If it fails, fallback.
    use_cnn = CNN_AVAILABLE
    
    # Extract target features
    target_features = None
    if use_cnn:
        target_features = extract_cnn_features(target_img_path)
    
    if target_features is None:
        use_cnn = False  # Switch to fallback mode
        target_features = extract_fallback_features(target_img_path)
        
    if target_features is None:
        print(json.dumps({"error": "Failed to extract features from target image"}))
        return
        
    # Extract product features and compute similarities
    results = []
    cache_updated = False
    
    for product in products_list:
        p_id = product.get("_id")
        images = product.get("image", [])
        if not images:
            continue
            
        # Use first image of product for visual matching
        img_url = images[0]
        
        # Check cache
        cache_key = f"{p_id}_{img_url}_{'cnn' if use_cnn else 'fallback'}"
        p_features = cache.get(cache_key)
        
        if p_features is None:
            # Extract features
            if use_cnn:
                p_features = extract_cnn_features(img_url)
            
            if p_features is None:
                # Fallback to color-texture
                p_features = extract_fallback_features(img_url)
                # Store under fallback key if we had to switch
                cache_key = f"{p_id}_{img_url}_fallback"
                
            if p_features is not None:
                cache[cache_key] = p_features
                cache_updated = True
                
        if p_features is not None:
            similarity = compute_similarity(target_features, p_features)
            results.append({
                "productId": p_id,
                "score": similarity
            })
            
    if cache_updated:
        save_cache(cache)
        
    # Sort results by similarity score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    
    print(json.dumps({
        "success": True,
        "mode": "CNN+FAISS" if use_cnn else "ColorHistogram+Texture",
        "matches": results
    }))

if __name__ == "__main__":
    main()
