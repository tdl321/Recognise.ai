# 🗑️ Waste Detection Web App

A real-time waste detection and analytics system that helps reduce recycling contamination and improve waste diversion at Amherst.

![Waste Detection](https://via.placeholder.com/800x400?text=Waste+Detection+Web+App)

## 🚀 Features

- **Real-time Detection**: YOLOv11 model identifies waste types (Glass, Metal, Paper, Plastic) from webcam feed
- **Detection Zones**: User-defined zones to monitor specific areas
- **Audio Feedback**: Configurable sounds for correct/incorrect waste disposal
- **Analytics Dashboard**: Real-time and historical waste data visualization
- **Performance Metrics**: Inference speed benchmarking for model performance

## 📋 Prerequisites

- Node.js (v16+)
- Python (3.8+)
- Supabase account (free tier works fine)
- Webcam (built-in or external)

## ⚙️ Tech Stack

### Frontend
- Next.js (App Router)
- Shadcn UI components
- React Webcam
- Tremor for data visualization
- Tailwind CSS

### Backend
- FastAPI
- Ultralytics YOLOv11
- Supabase (PostgreSQL + Realtime)

## 🛠️ Installation

### Quick Setup

Run our interactive setup script:

```bash
node setupDemo.js
```

This script will guide you through:
1. Setting up Supabase
2. Configuring your environment variables
3. Starting the FastAPI backend
4. Running the Next.js frontend

### Manual Setup

1. **Clone the repository**

```bash
git clone <repository-url>
cd waste-detection-webapp
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example env file and fill in your Supabase details:

```bash
cp .env.example .env.local
```

4. **Set up the FastAPI backend**

```bash
cd detection_api
pip install -r requirements.txt
```

5. **Set up Supabase**

- Create a new project at [Supabase](https://supabase.com)
- Create a `detections` table with the following schema:
  ```sql
  CREATE TABLE IF NOT EXISTS detections (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    waste_type TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    inference_speed FLOAT NOT NULL
  );
  ```
- Enable Realtime for the `detections` table

## 🚀 Running the Application

1. **Start the FastAPI backend**

```bash
cd detection_api
uvicorn main:app --reload
```

2. **Start the Next.js frontend**

```bash
npm run dev
```

3. **Open your browser at [http://localhost:3000](http://localhost:3000)**

## 📱 Usage Guide

### 📷 Detection Page

1. Allow camera access when prompted
2. Draw detection zones by clicking and dragging on the camera feed
3. Position waste items in view to see real-time detection
4. Listen for audio feedback on correct/incorrect disposal

### 📊 Analytics Page

1. View real-time waste statistics
2. Toggle between live and historical data
3. Switch between bar and pie charts for different visualizations
4. Analyze trends in waste disposal and contamination rates

### ⚙️ Settings Page

1. Adjust detection sensitivity
2. Configure audio feedback sounds and volume
3. Set inference speed thresholds
4. Seed the database with mock data for testing

## 🧠 Model Training

The YOLOv11 model was trained on the [Roboflow waste sorting dataset](https://universe.roboflow.com/proje-nkf76/atik-ayristirma).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Amherst College Sustainability Office
- Ultralytics for the YOLOv11 implementation
- Roboflow for the waste sorting dataset 