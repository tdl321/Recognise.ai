# Waste Detection Web App Usage Guide

This application provides real-time waste detection using a trained YOLOv11 model with a web interface.

## Running the Application

### 1. Start the API Server

The API server processes the detection requests and serves results to the frontend.

```bash
./start_api_server.sh
```

This will start the FastAPI server on port 8001. You can specify a different port if needed:

```bash
./start_api_server.sh 8000
```

### 2. Run the Waste Detection Model Directly (Optional)

If you want to test the detection model directly without the web interface:

```bash
./run_waste_detector.sh
```

By default, this uses your laptop camera (usb1) at 1280x720 resolution. You can specify different parameters:

```bash
./run_waste_detector.sh usb0 640x480
```

## Usage Tips

1. **Camera Access**: Ensure your browser has permission to access your camera when using the web interface.

2. **Detection Zones**: You can define specific detection zones in the web interface by drawing on the camera feed.

3. **Analytics**: View real-time analytics on the dashboard page that show waste classification statistics.

4. **Model Path**: The application uses the model at `model/my_model.pt` for detection.

## Troubleshooting

- If the camera doesn't work with `usb1`, try `usb0` or `usb2`.
- Check the logs in `detection_api/server_log.txt` if you encounter any issues with the API server.
- Make sure the model file `model/my_model.pt` exists in the correct location. 