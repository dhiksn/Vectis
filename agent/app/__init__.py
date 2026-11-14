"""VPS Control Center Backend Agent Application"""
import os
import sys

_app_dir = os.path.dirname(os.path.abspath(__file__))
_agent_dir = os.path.dirname(_app_dir)
_root_dir = os.path.dirname(_agent_dir)

for _p in [_root_dir, _agent_dir]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

__version__ = "1.0.0"
