import os
import json

result = {}

for filename in os.listdir("./weightings/"):
	name = filename.replace(".json", "")
	with open("./weightings/" + filename) as fd:
		result[name] = json.load(fd)

ects_sums = []
for name in result:
	ects = 0
	for entry in result[name]:
		if type(entry["ects"]) == int:
			ects += entry["ects"]

	ects_sums.append((name, ects))

ects_sums.sort(key=lambda x: x[1])
for name, ects in ects_sums:
	print("{:3d} {}".format(ects, name))

with open("spo-grade-weights.json", "w+") as fd:
	json.dump(result, fd)