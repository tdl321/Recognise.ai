# Waste Detection Web App

A locally hosted web application for real-time trash detection using YOLOv11 via laptop camera or cloud GPU (Google Colab). The app includes user-defined detection zones, audio alarms for correct/incorrect disposal, inference speed benchmarking, and a real-time analytics dashboard.

## Project Structure

- `model/`: Contains YOLOv11 scripts and model files
- `detection_api/`: FastAPI backend for waste detection
- `webapp/`: Next.js frontend with camera integration

## Features

- Real-time waste detection via laptop/webcam
- User-defined detection zones for monitoring (drag-and-draw opaque boxes)
- Audio alarms for correct/incorrect disposal
- Inference speed benchmarking
- Analytics dashboard for waste metrics
- Database logging for waste diversion data

## Tech Stack

### Frontend
- Next.js (App Router) with Shadcn UI components
- `react-webcam` for camera feed
- Tremor for analytics visualization
- Tailwind CSS for styling

### Backend
- FastAPI for API endpoints (`/detect`, `/analytics`)
- Ultralytics YOLOv11 (Python/Conda; trained on Roboflow dataset)
- Supabase (PostgreSQL) for logs/analytics with Realtime capabilities

### Data Processing
- Local processing using CPU/GPU
- Optional cloud GPU processing via Google Colab

## Getting Started

### Prerequisites
- Python 3.8+ with Conda environment
- Node.js 18+
- Camera/webcam access
- (Optional) Google Colab account for cloud GPU training

### Setup Local Environment
1. Set up the YOLOv11 environment:
   ```bash
   conda create -n yolo-env1 python=3.8
   conda activate yolo-env1
   pip install -r requirements.txt
   ```

### Using Google Colab (Alternative for Training)
1. Create a new Google Colab notebook
2. Install dependencies:
   ```python
   !pip install ultralytics supabase-py
   ```
3. Clone the repository:
   ```python
   !git clone https://github.com/yourusername/waste-detection-webapp.git
   ```
4. Train the model on Roboflow dataset:
   ```python
   from ultralytics import YOLO
   
   # Download dataset from Roboflow
   !pip install roboflow
   from roboflow import Roboflow
   rf = Roboflow(api_key="YOUR_API_KEY")
   project = rf.workspace("proje-nkf76").project("atik-ayristirma")
   dataset = project.version(1).download("yolov8")
   
   # Train YOLOv11 model
   model = YOLO("yolov11n.pt")
   results = model.train(data="atik-ayristirma-1/data.yaml", epochs=50)
   ```

### Starting the Application
1. Start the detection API:
   ```bash
   cd detection_api
   uvicorn main:app --reload
   ```

2. Start the web application:
   ```bash
   cd webapp
   npm install
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Environment Variables

Create a `.env` file in the root directory:

```
MODEL_PATH=model/best.pt
CONFIDENCE_THRESHOLD=0.5
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-anon-key
```

## Roadmap

- [x] Environment Setup
- [ ] Backend API
- [ ] Frontend Setup
- [ ] Analytics Dashboard
- [ ] Alarm System

## Waste Categories

Currently, the system is trained to detect four waste categories:
- Glass
- Metal
- Paper 
- Plastic 