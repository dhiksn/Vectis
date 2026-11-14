import os
import sys

# Ensure both project root and agent dir are in sys.path
agent_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(agent_dir)

for p in [root_dir, agent_dir]:
    if p not in sys.path:
        sys.path.insert(0, p)

import uvicorn

if __name__ == "__main__":
    print("[VPS Control Center] Starting agent on http://127.0.0.1:8000 ...")
    uvicorn.run(
        "agent.app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=[agent_dir]
    )
