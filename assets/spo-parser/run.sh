#!/bin/bash

if [ "$NEXT_PUBLIC_GUEST_ONLY" = "true" ]; then
	echo "Skipping grade weight extraction (guest only mode)"
	echo "{}" > spo-grade-weights.json
	exit 0
fi

mkdir -p SPOs
python3 download_spo_pdfs.py

mkdir -p weightings
for filename in SPOs/*.pdf; do
	outfile=$(echo "$filename" | sed 's/^SPOs/weightings/' | sed 's/.pdf$/.json/')
	echo "Analyzing $filename => $outfile"
	python3 extract_grade_weighting.py "$filename" "$outfile"
done

python3 combine_jsons.py
mv ./spo-grade-weights.json /generated/spo-grade-weights.json
