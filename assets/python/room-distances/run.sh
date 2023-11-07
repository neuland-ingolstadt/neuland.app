#!/bin/bash

# Fail if any error occurs
set -euxo pipefail

# Specify the name of the Python script
python_script="calculate-distances.py"

# Run Script
python "$python_script"