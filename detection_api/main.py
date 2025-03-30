from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import numpy as np
import cv2
from ultralytics import YOLO
import os
import base64
from io import BytesIO
from PIL import Image
import time
import json
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import sys
import subprocess
import tempfile

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

try:
    from supabase import create_client, Client
except ImportError:
    print("Supabase client not installed. Database logging will be disabled.")

# Initialize FastAPI app
app = FastAPI(title="Waste Detection API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
MODEL_PATH = os.getenv("MODEL_PATH", "../model/my_model.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
USE_WASTE_YOLO_DETECT = False  # Set to False to use our direct model implementation

# Define default preset zones (left and right sides of the frame)
# These will be used if no detection zone is provided
DEFAULT_ZONES = {
    "left": {
        "coordinates": [(0, 0), (426, 720)],  # Left third of 1280x720 frame
        "correct_types": ["paper", "cardboard"]
    },
    "right": {
        "coordinates": [(854, 0), (1280, 720)],  # Right third of 1280x720 frame
        "correct_types": ["plastic", "metal", "glass"]
    }
}

# Initialize the YOLO model (lazy loading on first request)
model = None
supabase = None

@app.on_event("startup")
async def startup_event():
    global model, supabase
    print("\n=== Starting up the Waste Detection API ===")
    
    # Create model directory if it doesn't exist
    os.makedirs("model", exist_ok=True)
    
    print(f"Using model path: {MODEL_PATH}")
    print(f"Model file exists: {os.path.exists(MODEL_PATH)}")
    print(f"Working directory: {os.getcwd()}")
    print(f"Using waste_yolo_detect.py: {USE_WASTE_YOLO_DETECT}")
    
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            print(f"Model file {MODEL_PATH} not found. Looking for alternative paths...")
            
            # List of possible model paths to try
            possible_paths = [
                "yolov8n.pt",  # In the same directory
                "../model/my_model.pt",  # One level up
                "../model/yolov8n.pt"    # One level up fallback
            ]
            
            model_loaded = False
            for path in possible_paths:
                if os.path.exists(path):
                    print(f"Found model at path: {path}")
                    model = YOLO(path)
                    model_loaded = True
                    break
                    
            if not model_loaded:
                print("No model found. Downloading default YOLOv8n...")
                model = YOLO("yolov8n")  # This will download the model if not present
        else:
            model = YOLO(MODEL_PATH)
            
        print(f"Model loaded successfully")
        print(f"Model classes: {list(model.names.values())}")
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None
    
    # Initialize Supabase client if credentials are available
    if SUPABASE_URL and SUPABASE_KEY:
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("Supabase client initialized successfully")
        except Exception as e:
            print(f"Error initializing Supabase client: {e}")
            supabase = None
    print("=== Startup complete ===\n")

@app.get("/")
async def root():
    return {"message": "Waste Detection API. Use /detect endpoint to detect waste in images."}

@app.get("/test")
async def test():
    """Test endpoint to verify the API is working and can find the waste_yolo_detect.py script"""
    try:
        waste_yolo_detect_path = os.path.abspath("../model/waste_yolo_detect.py") 
        model_path = os.path.abspath("../model/my_model.pt")
        
        result = {
            "message": "API test endpoint",
            "waste_yolo_detect_path": waste_yolo_detect_path,
            "waste_yolo_detect_exists": os.path.exists(waste_yolo_detect_path),
            "model_path": model_path,
            "model_exists": os.path.exists(model_path),
            "working_directory": os.getcwd(),
            "python_executable": sys.executable
        }
        
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/detect")
async def detect_waste(
    file: UploadFile = File(...),
    detection_zone: Optional[str] = Form(None)
):
    """
    Detect waste in the uploaded image.
    
    Args:
        file: The image file to analyze
        detection_zone: Optional JSON string with detection zone coordinates [x1,y1,x2,y2]
    
    Returns:
        JSON with detection results
    """
    global model, supabase
    
    try:
        # Measure start time for inference speed benchmarking
        start_time = time.time()
        print(f"\n=== Starting detection request at {datetime.now().isoformat()} ===")
        
        # Read and process the image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Get image dimensions for zone calculations
        img_height, img_width = img.shape[:2]
        
        # Scale default zones if necessary
        scaled_zones = DEFAULT_ZONES
        if img_width != 1280 or img_height != 720:
            scale_x = img_width / 1280
            scale_y = img_height / 720
            scaled_zones = {
                "left": {
                    "coordinates": [
                        (int(DEFAULT_ZONES["left"]["coordinates"][0][0] * scale_x),
                         int(DEFAULT_ZONES["left"]["coordinates"][0][1] * scale_y)),
                        (int(DEFAULT_ZONES["left"]["coordinates"][1][0] * scale_x),
                         int(DEFAULT_ZONES["left"]["coordinates"][1][1] * scale_y))
                    ],
                    "correct_types": DEFAULT_ZONES["left"]["correct_types"]
                },
                "right": {
                    "coordinates": [
                        (int(DEFAULT_ZONES["right"]["coordinates"][0][0] * scale_x),
                         int(DEFAULT_ZONES["right"]["coordinates"][0][1] * scale_y)),
                        (int(DEFAULT_ZONES["right"]["coordinates"][1][0] * scale_x),
                         int(DEFAULT_ZONES["right"]["coordinates"][1][1] * scale_y))
                    ],
                    "correct_types": DEFAULT_ZONES["right"]["correct_types"]
                }
            }
        
        # Process detection zone if provided
        user_zone = None
        if detection_zone:
            try:
                user_zone = json.loads(detection_zone)
                print(f"Detection zone provided: {user_zone}")
                
                # Apply detection zone (crop image if needed)
                if isinstance(user_zone, list) and len(user_zone) == 4:
                    x1, y1, x2, y2 = [int(coord) for coord in user_zone]
                    cropped_img = img[y1:y2, x1:x2].copy()
                    print(f"Applied detection zone: [{x1}, {y1}, {x2}, {y2}]")
                    # Create detection rectangle for visualization
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    # Use cropped image for detection
                    detection_img = cropped_img
                else:
                    detection_img = img
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid detection zone format")
        else:
            # No user zone provided, use the full image
            detection_img = img
            
            # Draw preset zones for visualization
            left_zone = scaled_zones["left"]["coordinates"]
            right_zone = scaled_zones["right"]["coordinates"]
            
            # Draw left zone (paper/cardboard)
            cv2.rectangle(
                img, 
                (left_zone[0][0], left_zone[0][1]), 
                (left_zone[1][0], left_zone[1][1]), 
                (0, 0, 255), 2
            )
            cv2.putText(
                img, 
                "Paper/Cardboard", 
                (left_zone[0][0] + 10, left_zone[0][1] + 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2
            )
            
            # Draw right zone (plastic/metal/glass)
            cv2.rectangle(
                img, 
                (right_zone[0][0], right_zone[0][1]), 
                (right_zone[1][0], right_zone[1][1]), 
                (255, 0, 0), 2
            )
            cv2.putText(
                img, 
                "Plastic/Metal/Glass", 
                (right_zone[0][0] + 10, right_zone[0][1] + 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2
            )
        
        # Run actual YOLO detection on the image
        if model is None:
            raise HTTPException(status_code=500, detail="Model not loaded")
            
        # Start inference time measurement
        inference_start = time.time()
        results = model(detection_img)
        inference_time = time.time() - inference_start
        inference_fps = 1.0 / inference_time if inference_time > 0 else 0
        
        # Process YOLO results
        detections = []
        detected_waste_type = None
        highest_conf = 0
        
        result = results[0]  # Get first result
        
        # Map YOLO classes to our waste types
        WASTE_CLASS_MAPPING = {
            0: "glass",
            1: "metal", 
            2: "paper",
            3: "plastic"
        }
        
        # Default fallback classes if model uses different classes
        if not any(cls_id in model.names for cls_id in WASTE_CLASS_MAPPING):
            WASTE_CLASS_MAPPING = {}
            for idx, class_name in model.names.items():
                if 'paper' in class_name.lower() or 'cardboard' in class_name.lower():
                    WASTE_CLASS_MAPPING[idx] = 'paper'
                elif 'glass' in class_name.lower():
                    WASTE_CLASS_MAPPING[idx] = 'glass'
                elif 'metal' in class_name.lower() or 'can' in class_name.lower():
                    WASTE_CLASS_MAPPING[idx] = 'metal'
                elif 'plastic' in class_name.lower() or 'bottle' in class_name.lower():
                    WASTE_CLASS_MAPPING[idx] = 'plastic'
                else:
                    WASTE_CLASS_MAPPING[idx] = class_name.lower()
        
        # Extract detections from the model results
        all_waste_in_zones = []
        
        for box in result.boxes:
            cls_id = int(box.cls.item())
            conf = float(box.conf.item())
            
            # Skip if confidence is too low
            if conf < CONFIDENCE_THRESHOLD:
                continue
                
            # Get class name and mapped waste type
            class_name = model.names[cls_id]
            waste_type = WASTE_CLASS_MAPPING.get(cls_id, class_name.lower())
            
            # Track highest confidence detection
            if conf > highest_conf:
                highest_conf = conf
                detected_waste_type = waste_type
            
            # Get bounding box coordinates
            xyxy = box.xyxy.cpu().numpy().squeeze().astype(int).tolist()
            
            # Handle different result shapes
            if not isinstance(xyxy, list):
                continue
            if len(xyxy) != 4:
                continue
                
            # Create detection object
            detection = {
                "class_id": cls_id,
                "class_name": class_name,
                "waste_type": waste_type,
                "confidence": float(conf),
                "bbox": xyxy
            }
            detections.append(detection)
            
            # Check if detection is in any of the preset zones
            # If we're using a user-defined detection zone, we'll use that instead
            if user_zone:
                # User zone is already applied in cropping, so all detections are "in zone"
                is_in_zone = True
                is_correct = True  # We assume user-defined zones are always "correct"
            else:
                # Check if detection is in left or right zone and if it's the correct waste type
                xmin, ymin, xmax, ymax = xyxy
                
                # Check left zone (paper/cardboard)
                left_zone = scaled_zones["left"]["coordinates"]
                is_in_left = (
                    xmin < left_zone[1][0] and xmax > left_zone[0][0] and
                    ymin < left_zone[1][1] and ymax > left_zone[0][1]
                )
                
                # Check right zone (plastic/metal/glass)
                right_zone = scaled_zones["right"]["coordinates"]
                is_in_right = (
                    xmin < right_zone[1][0] and xmax > right_zone[0][0] and
                    ymin < right_zone[1][1] and ymax > right_zone[0][1]
                )
                
                is_in_zone = is_in_left or is_in_right
                
                # Determine if waste is correctly disposed
                if is_in_left:
                    is_correct = waste_type in scaled_zones["left"]["correct_types"]
                    zone_name = "left"
                elif is_in_right:
                    is_correct = waste_type in scaled_zones["right"]["correct_types"]
                    zone_name = "right"
                else:
                    is_correct = False
                    zone_name = None
                
                # Add to tracking list if in a zone
                if is_in_zone:
                    all_waste_in_zones.append({
                        "waste_type": waste_type,
                        "is_correct": is_correct,
                        "zone": zone_name,
                        "confidence": conf
                    })
            
            # Draw detection on the image
            color = (0, 255, 0) if (is_in_zone and is_correct) else (0, 0, 255)
            if user_zone:
                # Adjust coordinates for cropped image to original
                x1, y1, x2, y2 = user_zone
                adjusted_xyxy = [
                    xyxy[0] + x1, xyxy[1] + y1,
                    xyxy[2] + x1, xyxy[3] + y1
                ]
                cv2.rectangle(img, (adjusted_xyxy[0], adjusted_xyxy[1]), (adjusted_xyxy[2], adjusted_xyxy[3]), color, 2)
                label = f"{waste_type}: {int(conf*100)}%"
                cv2.putText(img, label, (adjusted_xyxy[0], adjusted_xyxy[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            else:
                cv2.rectangle(img, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), color, 2)
                label = f"{waste_type}: {int(conf*100)}%"
                cv2.putText(img, label, (xyxy[0], xyxy[1]-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Determine overall detection result
        # For user-defined zones, we keep previous logic
        if user_zone:
            # If no waste detected but we need a response, use the fallback
            if not detected_waste_type and detections:
                detected_waste_type = detections[0].get("waste_type", "unknown")
            elif not detected_waste_type:
                # No detection at all
                detected_waste_type = "unknown"
                
            # Determine if waste is correctly disposed based on detection zone
            # This would be application-specific logic based on your requirements
            is_correct = user_zone is not None  # Simplified logic: waste is correctly disposed if in a zone
        else:
            # For preset zones, use the most confident detection that's in a zone
            if all_waste_in_zones:
                # Sort by confidence
                all_waste_in_zones.sort(key=lambda x: x["confidence"], reverse=True)
                top_zone_detection = all_waste_in_zones[0]
                detected_waste_type = top_zone_detection["waste_type"]
                is_correct = top_zone_detection["is_correct"]
            else:
                # No waste in any zone
                detected_waste_type = detected_waste_type or "unknown"
                is_correct = False
        
        print(f"Detected waste type: {detected_waste_type}, Is correct: {is_correct}")
        
        # Generate a base64 image of the result with annotations
        _, buffer = cv2.imencode('.jpg', img)
        img_str = base64.b64encode(buffer).decode('utf-8')
        
        # Total processing time
        total_time = time.time() - start_time
        
        # Create response
        timestamp = datetime.now().isoformat()
        response = {
            "timestamp": timestamp,
            "detections": detections,
            "detection_count": len(detections),
            "result_image": f"data:image/jpeg;base64,{img_str}",
            "performance": {
                "inference_time": float(inference_time),
                "inference_fps": float(inference_fps),
                "total_processing_time": float(total_time)
            },
            "waste_detection": {
                "waste_type": detected_waste_type,
                "is_correct": is_correct
            }
        }
        
        # Log to database if Supabase is configured
        if supabase and detected_waste_type:
            try:
                detection_log = {
                    "timestamp": timestamp,
                    "waste_type": detected_waste_type,
                    "is_correct": is_correct,
                    "inference_speed": inference_fps
                }
                supabase.table("detections").insert(detection_log).execute()
                print(f"Detection logged: {detected_waste_type}, correct: {is_correct}")
            except Exception as e:
                print(f"Error logging to database: {e}")
        
        print(f"=== Detection completed in {total_time:.2f}s ===\n")
        return JSONResponse(content=response)
    
    except Exception as e:
        print(f"ERROR in detect_waste: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.get("/analytics")
async def get_analytics():
    """Get analytics data from the database"""
    global supabase
    
    try:
        if supabase:
            # Query actual data from Supabase
            result = supabase.table("detections").select("*").order("timestamp", desc=True).limit(100).execute()
            data = result.data
            
            # Process data for analytics
            waste_types = {"glass": 0, "metal": 0, "paper": 0, "plastic": 0}
            correct_disposals = 0
            incorrect_disposals = 0
            
            for record in data:
                waste_type = record.get("waste_type")
                if waste_type in waste_types:
                    waste_types[waste_type] += 1
                
                if record.get("is_correct"):
                    correct_disposals += 1
                else:
                    incorrect_disposals += 1
            
            response = {
                "waste_types": waste_types,
                "correct_disposals": correct_disposals,
                "incorrect_disposals": incorrect_disposals,
                "total_detections": len(data),
                "recent_detections": data[:10]  # Return the most recent 10 detections
            }
            
            return JSONResponse(content=response)
    except Exception as e:
        print(f"Error querying analytics: {e}")
    
    # Fallback to mock data
    mock_data = {
        "waste_types": {
            "plastic": 45,
            "paper": 32,
            "metal": 15,
            "glass": 8
        },
        "correct_disposals": 78,
        "incorrect_disposals": 22,
        "total_detections": 100,
        "recent_detections": [
            {"timestamp": "2023-04-01T10:30:00", "waste_type": "plastic", "is_correct": True},
            {"timestamp": "2023-04-01T10:35:00", "waste_type": "paper", "is_correct": False},
            {"timestamp": "2023-04-01T10:40:00", "waste_type": "metal", "is_correct": True}
        ]
    }
    return JSONResponse(content=mock_data)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=True) 