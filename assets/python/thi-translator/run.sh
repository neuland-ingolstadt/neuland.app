#! /bin/bash

# Specify the name of the Python script
python_script="thi-translator.py"

# Check if the Python script exists
if [ -f "$python_script" ]; then
    # Run the Python script
    python "$python_script"
else
    echo "Python script '$python_script' not found."
    exit 1
fi