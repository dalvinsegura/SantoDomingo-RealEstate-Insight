#!/usr/bin/env python3
"""Ejecuta la aplicación Flask desde la raíz del proyecto."""
import os
import sys

# Asegura que src esté en el path para imports "database.*"
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))
os.chdir(os.path.join(os.path.dirname(__file__), "src"))

from app import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=True)
