# PathSmart Backend Server

This backend consists of two components:
1. **Express.js Server** (Node.js) - Runs on port 5000
2. **Flask Server** (Python) - Runs on port 5001 (started by Express)

## Setup Instructions

### Prerequisites
- Node.js 16+ installed
- Python 3.8+ installed
- pip (Python package manager)

### Installation

1. **Install Node.js dependencies:**
```powershell
cd backend
npm install
```

2. **Install Python dependencies:**
```powershell
pip install flask flask-cors
```

3. **Verify data files exist:**
   - `../app/utils/f1nodes.json`
   - `../app/utils/connections.json`
   - `../app/utils/saveData.json`

### Starting the Server

**Option 1: Start Express (recommended - will auto-start Python)**
```powershell
npm start
# or
node server.js
```

**Option 2: Start Python Flask directly**
```powershell
python pathfinder.py
```

Then in another terminal, start Express:
```powershell
npm start
```

## API Endpoints

### POST /findpath
Calculates the shortest path to a product or stall.

**Request body:**
```json
{
  "start": 14,
  "shopping_list": [
    {"id": "p1", "name": "Product 1", "type": "Product", "category": "Category"}
  ],
  "current_index": 0,
  "current_stall_id": null,
  "excluded_end_nodes": [],
  "optimize": false
}
```

**Response:**
```json
{
  "path": [14, 15, 16, 17],
  "current_stall": "stall_1",
  "shopping_list": [...],
  "current_index": 0
}
```

## Troubleshooting

### "Network request failed" errors in the app
- Make sure Node.js server is running on `http://localhost:5000`
- Check that Python has required packages: `pip install flask flask-cors`
- Look at console logs for Python/Flask errors

### Python module not found errors
```powershell
# Reinstall dependencies
pip install --upgrade flask flask-cors
```

### Port already in use
Change ports in `server.js` and `pathfinder.py` if ports 5000 or 5001 are already in use.

## Architecture

```
Mobile App (http://localhost:5000)
        ↓
   Express Server (port 5000)
        ↓
   Python Flask Server (port 5001)
        ↓
   PathFinding Algorithm
```

The Express server proxies all requests to the Flask server, allowing for better integration and potential future middleware.
