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
MODEL_PATH = os.getenv("MODEL_PATH", "model/best.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.5"))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Initialize the YOLO model (lazy loading on first request)
model = None
supabase = None

@app.on_event("startup")
async def startup_event():
    global model, supabase
    try:
        # Check if model file exists
        if not os.path.exists(MODEL_PATH):
            print(f"Warning: Model file {MODEL_PATH} not found. Will use default YOLOv8n model.")
            model = YOLO("yolov8n.pt")
        else:
            model = YOLO(MODEL_PATH)
        print(f"Model loaded successfully: {MODEL_PATH}")
        
        # Initialize Supabase client if credentials are available
        if SUPABASE_URL and SUPABASE_KEY:
            try:
                supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                print("Supabase client initialized successfully")
            except Exception as e:
                print(f"Error initializing Supabase client: {e}")
                supabase = None
    except Exception as e:
        print(f"Error loading model: {e}")
        model = None

@app.get("/")
async def root():
    return {"message": "Waste Detection API. Use /detect endpoint to detect waste in images."}

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
    
    if model is None:
        try:
            # Attempt to load model
            if os.path.exists(MODEL_PATH):
                model = YOLO(MODEL_PATH)
            else:
                model = YOLO("yolov8n.pt")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model initialization failed: {e}")
    
    try:
        # Measure start time for inference speed benchmarking
        start_time = time.time()
        
        # Read and process the image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image file")
        
        # Process detection zone if provided
        zone = None
        if detection_zone:
            try:
                zone = json.loads(detection_zone)
                # Apply detection zone (crop image if needed)
                if isinstance(zone, list) and len(zone) == 4:
                    x1, y1, x2, y2 = [int(coord) for coord in zone]
                    img = img[y1:y2, x1:x2]
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid detection zone format")
        
        # Run inference
        inference_start = time.time()
        results = model(img, conf=CONFIDENCE_THRESHOLD)
        inference_end = time.time()
        
        # Calculate inference speed
        inference_time = inference_end - inference_start
        inference_fps = 1.0 / inference_time if inference_time > 0 else 0
        
        # Process results
        detections = []
        waste_classes = ["glass", "metal", "paper", "plastic"]  # Expected waste categories
        detected_waste_type = None
        is_correct = False  # Default value, actual logic would depend on detection zones
        
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls.item())
                class_name = model.names[class_id]
                confidence = float(box.conf.item())
                bbox = box.xyxy.tolist()[0]  # Convert to Python list
                
                # If we used a detection zone, adjust coordinates back to original image
                if zone:
                    bbox[0] += zone[0]
                    bbox[1] += zone[1]
                    bbox[2] += zone[0]
                    bbox[3] += zone[1]
                
                detection = {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": bbox
                }
                detections.append(detection)
                
                # For waste detection tracking
                if class_name.lower() in waste_classes and (detected_waste_type is None or confidence > detections[-1]["confidence"]):
                    detected_waste_type = class_name.lower()
                    
                    # Here you would implement logic to determine if waste is correctly disposed
                    # based on the detection zone and waste type
                    # For now, we'll use a random value for demonstration
                    is_correct = bool(round(time.time() % 2))
        
        # Generate a base64 image of results for visualization
        result_img = results[0].plot()
        _, buffer = cv2.imencode('.jpg', result_img)
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
                "inference_time": inference_time,
                "inference_fps": inference_fps,
                "total_processing_time": total_time
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
        
        return JSONResponse(content=response)
    
    except Exception as e:
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True) 