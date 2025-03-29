# Waste Detection API

A FastAPI backend for waste detection using YOLOv11.

## Setup

1. Install dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```

2. Set up environment variables:
   ```bash
   export MODEL_PATH=../model/best.pt
   export CONFIDENCE_THRESHOLD=0.5
   export SUPABASE_URL=your-supabase-url
   export SUPABASE_KEY=your-supabase-anon-key
   ```

3. Run the API:
   ```bash
   uvicorn main:app --reload
   ```

4. The API will be available at `http://localhost:8000`

## API Endpoints

### GET /
- Health check endpoint

### POST /detect
- Detects waste in an uploaded image
- Parameters:
  - `file`: The image file to analyze (required)
  - `detection_zone`: JSON string with detection zone coordinates [x1,y1,x2,y2] (optional)
- Returns:
  - JSON with detection results, including:
    - Bounding boxes and class names
    - Base64-encoded result image
    - Inference speed benchmarking metrics (inference_time, inference_fps)
    - Waste detection information (waste_type, is_correct)

### GET /analytics
- Returns analytics data about waste detections
- Returns:
  - JSON with waste detection statistics:
    - Waste type breakdown (glass, metal, paper, plastic)
    - Correct vs incorrect disposals
    - Total detection count
    - Recent detection events

## Database Integration

The API integrates with Supabase to store detection events:
- Each detection logs the waste_type, timestamp, is_correct flag, and inference_speed
- The analytics endpoint queries this data for dashboard visualization
- Supabase Realtime capabilities are used to update the dashboard in real-time

## Environment Variables

- `MODEL_PATH`: Path to the YOLO model file (default: "model/best.pt")
- `CONFIDENCE_THRESHOLD`: Minimum confidence threshold for detections (default: 0.5)
- `SUPABASE_URL`: URL of your Supabase project
- `SUPABASE_KEY`: API key for your Supabase project

## Interactive API Documentation

FastAPI provides automatic API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc` 