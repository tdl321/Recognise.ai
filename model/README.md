# YOLO Waste Detection Model

This directory contains the scripts for the waste detection model using YOLOv11.

## yolo_detect.py

A script for running object detection using YOLOv11 with various input sources (images, videos, webcam).

### Usage

```bash
python yolo_detect.py --model [PATH_TO_MODEL] --source [SOURCE] [OPTIONAL_ARGS]
```

### Required Arguments

- `--model`: Path to the YOLO model file (e.g., "my_model.pt")
- `--source`: Image/video source. Can be:
  - An image file (e.g., "test.jpg")
  - A folder containing images (e.g., "test_folder")
  - A video file (e.g., "video.mp4")
  - A webcam (e.g., "usb0" for the first webcam)

### Optional Arguments

- `--thresh`: Confidence threshold for detections (default: 0.5)
- `--resolution`: Output resolution in WxH format (e.g., "1280x720")
- `--record`: Flag to record video output to "demo1.avi" (requires --resolution)

### Examples

1. Run detection on an image:
   ```bash
   python yolo_detect.py --model my_model.pt --source test_image.jpg
   ```

2. Run detection on a video:
   ```bash
   python yolo_detect.py --model my_model.pt --source test_video.mp4 --resolution 1280x720
   ```

3. Run detection on a webcam and record:
   ```bash
   python yolo_detect.py --model my_model.pt --source usb0 --resolution 1280x720 --record
   ```

### Controls

- Press 'q' to quit
- Press 's' to pause
- Press 'p' to save the current frame as "capture.png"

## Training on Google Colab

For training the YOLOv11 model on the Roboflow waste detection dataset, we recommend using Google Colab:

1. Create a new Colab notebook
2. Run the following code:

```python
# Install dependencies
!pip install ultralytics roboflow

# Import libraries
from ultralytics import YOLO
from roboflow import Roboflow

# Download dataset from Roboflow
rf = Roboflow(api_key="YOUR_API_KEY")
project = rf.workspace("proje-nkf76").project("atik-ayristirma")
dataset = project.version(1).download("yolov8")

# Initialize and train YOLOv11 model
model = YOLO("yolov11n.pt")
results = model.train(data="atik-ayristirma-1/data.yaml", epochs=50, imgsz=640)

# Export the model
model.export(format="onnx")

# Download the trained model
from google.colab import files
files.download("runs/detect/train/weights/best.pt")
``` 