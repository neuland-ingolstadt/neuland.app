import requests
import json
from pathlib import Path
from math import ceil
from geopy import distance

MAP_URL = 'https://assets.neuland.app/rooms_neuland.geojson'
ROOM_TYPES = ['Hörsaal', 'PC-Pool', 'Vorlesung', 'Seminarraum']

# read file from URL
response = requests.get(MAP_URL)
data = response.json()

rooms = data['features']

# filter rooms by type where a room type is partly in 'Funktion'
filtered_rooms = [room for room in rooms if any([room_type in str(room['properties']['Funktion']) for room_type in ROOM_TYPES])]

# calculate center of room from coordinates
def calculate_center(room):
    lat = []
    long = []

    for l in room['geometry']['coordinates'][0]:
        lat.append(l[0])
        long.append(l[1])

    return [sum(lat)/len(lat), sum(long)/len(long)]

# add centers to rooms
for room in filtered_rooms:
    room['center'] = calculate_center(room)

# calculate distances between rooms
distances = {}

for room in filtered_rooms:
    room_name = room['properties']['Raum']
    distances[room_name] = {}

    for room2 in filtered_rooms:
        room2_name = room2['properties']['Raum']

        if room_name == room2_name:
            distances[room_name][room2_name] = 0
        
        center = room['center']
        center2 = room2['center']

        # calculate distance between two points
        room_distance = distance.distance(center, center2).meters

        distances[room_name][room2_name] = ceil(room_distance)

path = Path(__file__).parent / 'room-distances.json'

# write to file
with open(path, 'w+') as outfile:
    json.dump(distances, outfile)