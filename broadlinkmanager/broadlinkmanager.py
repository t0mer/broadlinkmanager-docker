import sys
import os

# Ensure the broadlinkmanager/ directory is on the path so `app` package is found
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=7020, reload=False)
