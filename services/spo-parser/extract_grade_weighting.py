import re
import sys
import json
import camelot

if len(sys.argv) != 3:
	print("Usage: extract_grade_weighting.py <pdf file> <json output file>", file=sys.stderr)
	exit(1)

def find_col(data, needle):
	for row in data[0 : 3]:
		for i, col in enumerate(row):
			col = re.sub(r"\W", "", col.lower())
			if needle in col:
				return i

	return None

tables = camelot.read_pdf(sys.argv[1], pages="all")

entries = []
unfinished_table = False
for table in tables:
	data = table.data
	if len(data) < 2 or len(data[-1]) < 2:
		continue

	is_finished = "summe" in data[-1][1].lower()
	if is_finished:
		# remove sum row
		data = data[0 : -1]

	if not unfinished_table:
		num_col = find_col(data, "lfdnr") or find_col(data, "nummer") or find_col(data, "lfd")
		name_col = find_col(data, "modul") or find_col(data, "fächer") or find_col(data, "fach")
		sws_col = find_col(data, "sws")
		weight_col = find_col(data, "gewichtung")
		ects_col = find_col(data, "punkte") or find_col(data, "ects")

	if any(x is None for x in [num_col, name_col, sws_col, weight_col, ects_col]):
		# ignore tables which dont list modules
		continue

	if data[0][0 : 3] == ["1", "2", "3"]:
		# skip first line which contains column indices
		data = data[1 : ]

	for row in data:
		if num_col >= len(row):
			continue

		apo_num = row[num_col].strip()
		if weight_col >= len(row) or re.match(r"^\d+(\.\d+)*\.?$", apo_num) is None:
			continue

		weight = row[weight_col]
		if "gesamt" in weight.lower():
			weight = {
				"type": "sum",
				"weight": float(re.sub("\\D", "", weight))
			}
		else:
			try:
				weight = float(weight.replace(",", "."))
			except ValueError:
				weight = None

		try:
			ects = int(row[ects_col])
		except ValueError:
			ects = None

		try:
			workload = int(row[sws_col])
		except ValueError:
			workload = None

		entries.append({
			"apo_number": apo_num,
			"name": re.sub("\\s+", " ", row[name_col]),
			"weekly_workload": workload,
			"weight": weight,
			"ects": ects
		})

	unfinished_table = not is_finished

with open(sys.argv[2], "w+") as fd:
	json.dump(entries, fd)

print("ECTS sum:", sum(x["ects"] for x in entries if x["ects"] is not None))
