import requests
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from pathlib import Path
import json
import asyncio

OMDB_BASE_URL = "http://www.omdbapi.com/"

ADDITIONAL_TIME = 15 + 15 #(15 introduction short film + 15 minutes break)

BASE_DIR = Path(__file__).parent / "data"
MOVIES_PATH = BASE_DIR / "base_movies.json"
OUTPUT_PATH = BASE_DIR / "movies.json"


class MovieDetails:
    def __init__(self):
        load_dotenv()

        self.OMDB_API_KEY = os.getenv("OMDB_API_KEY")
        self.__check_env()

        self.movies = []

    def __check_env(self):
        """Checks if the environment variables are set"""
        if not self.OMDB_API_KEY:
            raise ValueError("OMDB_API_KEY is not set")

    async def __fetchMovieDuration(self, title):
        resp = requests.get(
            f"{OMDB_BASE_URL}?apikey={self.OMDB_API_KEY}&t={title.lower()}&type=movie"
        )
        data = resp.json()

        if not data["Response"] or data["Response"] == "False":
            return None

        return int(data["Runtime"].split()[0])

    async def __getEndTime(self, title, startTime):
        endTime = datetime.fromisoformat(startTime)

        duration = await self.__fetchMovieDuration(title)

        endTime += timedelta(minutes=duration)
        endTime += timedelta(minutes=ADDITIONAL_TIME)
        return endTime.isoformat()

    async def getMovies(self):
        with open(MOVIES_PATH, "r") as f:
            movies = json.load(f)

        return await asyncio.gather(*[self.__getMovieDetails(movie) for movie in movies])

    async def __getMovieDetails(self, movie):
        return {
            "id": hashlib.sha256(movie["title"].encode()).hexdigest(),
            "organizer": "Hochschulkino",
            "title": movie["title"],
            "begin": movie["date"],
            "end": await self.__getEndTime(movie["title"], movie["date"]),
        }

def main():
    movieDetails = MovieDetails()
    movies = asyncio.run(movieDetails.getMovies())

    with open(OUTPUT_PATH, "w+") as f:
        json.dump(movies, f, indent=4)

if __name__ == "__main__":
    main()
    