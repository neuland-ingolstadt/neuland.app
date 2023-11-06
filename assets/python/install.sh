#!/bin/bash

# Find all child directories with a requirements.txt file
directories=(*/)

# Loop through the child directories
for dir in "${directories[@]}"; do
    if [ -f "${dir}requirements.txt" ]; then
        echo "Installing packages in ${dir}requirements.txt..."
        pip install -r "${dir}requirements.txt"
        echo "Installation in ${dir} completed."
    fi
done
