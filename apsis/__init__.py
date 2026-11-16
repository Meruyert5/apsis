"""Apsis: find every route from a low-privilege AWS principal to administrator.

The public surface is deliberately small. Everything else is an implementation
detail that the test suite is allowed to reach into.

    from apsis import load_scenario, build, sever
"""

from __future__ import annotations

from .graph import build, Survey
from .model import ADMIN, Edge, Path
from .sever import sever
from .world import load_scenario

__version__ = "0.2.0"

__all__ = ["ADMIN", "Edge", "Path", "Survey", "build", "load_scenario", "sever", "__version__"]
