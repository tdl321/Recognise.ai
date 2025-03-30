#!/bin/bash

# Script to run the waste detection model
# Usage: ./run_waste_detector.sh [camera_index] [resolution]

# Default values
CAMERA_INDEX=${1:-"usb1"}  # Default to usb1 for laptop camera
RESOLUTION=${2:-"1280x720"}  # Default resolution

echo "Starting waste detection with camera $CAMERA_INDEX at resolution $RESOLUTION"
python model/waste_yolo_detect.py --model model/my_model.pt --source $CAMERA_INDEX --resolution $RESOLUTION

echo "Detection completed" 