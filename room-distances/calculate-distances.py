import requests
import json
from pathlib import Path
from math import ceil
from geopy import distance
import re


MAP_URL = 'https://assets.neuland.app/rooms_neuland_v2.3.geojson'
ROOM_TYPES = ['Hörsaal', 'PC-Pool', 'Vorlesung', 'Seminar', 'Labor']
STAIRCASE_TYPES = ['Treppenhaus']


# calculate center of room from coordinates
def calculate_center(room):
    lat, lon = zip(*[(p[0], p[1]) for p in room['geometry']['coordinates'][0]])

    return [sum(lat)/len(lat), sum(lon)/len(lon)]


def findNearestStaircase(room, staircases):
    nearest_distance = 999
    nearest_staircase = None

    roomFloor = room['properties']['Ebene']

    staircases = [staircase for staircase in staircases if staircase['properties']['Ebene'] == roomFloor and staircase['properties']['Gebaeude'] == room['properties']['Gebaeude']]
    
    if(len(staircases) == 0):
        return 0, room

    for staircase in staircases:
        room_distance = distance.distance(room['center'], staircase['center']).meters
        
        if room_distance < nearest_distance:
            nearest_distance = room_distance
            nearest_staircase = staircase

    return nearest_distance, nearest_staircase


def main():
    # read file from URL
    response = requests.get(MAP_URL)
    data = response.json()

    all_rooms = data['features']
    # filter for rooms without geometry
    all_rooms = [room for room in all_rooms if room['geometry'] is not None]

    # filter rooms by type where a room type is partly in 'Funktion'
    rooms = [room for room in all_rooms if any([room_type in str(room['properties']['Funktion']) for room_type in ROOM_TYPES])]
    staircases = [room for room in all_rooms if any([staircase_type in str(room['properties']['Funktion']) for staircase_type in STAIRCASE_TYPES])]

    # add centers to rooms
    for room in rooms:
        room['center'] = calculate_center(room)

    # add centers to staircases
    for staircase in staircases:
        staircase['center'] = calculate_center(staircase)

    # calculate distances between rooms
    distances = {}

    for room in rooms:
        room_name = room['properties']['Raum']
        distances[room_name] = {}

        for room2 in rooms:
            room2_name = room2['properties']['Raum']

            # if room is the same
            if room_name == room2_name:
                distances[room_name][room2_name] = 0

            # if room is in different building
            elif room['properties']['Gebaeude'] != room2['properties']['Gebaeude']:
                total_distance = 0
                # find nearest staircase
                distance1, nearestStaircase1 = findNearestStaircase(room, staircases)
                total_distance += distance1

                # add distance inside staircase (naive assumption)
                total_distance += float(room['properties']['Ebene']) * 5

                # find staircase in other building
                distance2, nearestStaircase2 = findNearestStaircase(room2, staircases)
                total_distance += distance2

                # add distance inside staircase (naive assumption)
                total_distance += float(room2['properties']['Ebene']) * 5

                # add distance between staircases
                total_distance += distance.distance(nearestStaircase1['center'], nearestStaircase2['center']).meters

                distances[room_name][room2_name] = ceil(total_distance)

            # if room is in same building, but on different floors
            elif room['properties']['Ebene'] != room2['properties']['Ebene']:
                total_distance = 0
                # find nearest staircase
                staircase_distance, nearest_staircase = findNearestStaircase(room, staircases)
                total_distance += staircase_distance

                # add distance inside staircase (naive assumption)
                total_distance += abs(float(room['properties']['Ebene']) - float(room2['properties']['Ebene'])) * 5

                # add distance from room to staircase
                total_distance += distance.distance(room2['center'], nearest_staircase['center']).meters

                distances[room_name][room2_name] = ceil(total_distance)
                
            else:
                # calculate distance between two points
                room_distance = distance.distance(room['center'], room2['center']).meters
                distances[room_name][room2_name] = ceil(room_distance)

    # write to file
    path = Path(__file__).parent / 'room-distances.json'
    with open(path, 'w+') as outfile:
        json.dump(distances, outfile)

if __name__ == "__main__":
    main()
