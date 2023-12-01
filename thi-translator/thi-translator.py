import json
import os
import re
from pathlib import Path

import deepl
import requests
from dotenv import load_dotenv

API_URL = "https://hiplan.thi.de/webservice/production2/index.php"
DEEPL_API_URL = "https://api.deepl.com/v2/translate"
MAIN_DIR = Path(__file__).parent.parent / "rogue-thi-app" / "public" / "locales"

DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")
THI_USERNAME = os.getenv("THI_USERNAME")
THI_PASSWORD = os.getenv("THI_PASSWORD")

GENDER_REGEX = re.compile(r"\(\w+\)")
CLEAN_REGEX = re.compile(r"\s+")

LANGUAGES = ["EN-US"]

MAP_URL = "https://assets.neuland.app/rooms_neuland_v2.4.geojson"


class ThiTranslator:
    def __init__(self):
        load_dotenv()

        self.DEEPL_API_KEY = os.getenv("DEEPL_API_KEY")
        self.THI_USERNAME = os.getenv("THI_USERNAME")
        self.THI_PASSWORD = os.getenv("THI_PASSWORD")

        self.__check_env()

        self.translator = deepl.Translator(self.DEEPL_API_KEY)
        self.__check_deepL()

        self.session_id = self.__open_session()
        self.path = Path(__file__).parent / "data"

        if not self.path.exists():
            self.path.mkdir()

        print(f'Opened session with id "{self.session_id}"')
        self.output = {}

    def __check_env(self):
        """Checks if the environment variables are set"""
        if not self.DEEPL_API_KEY:
            raise ValueError("DEEPL_API_KEY is not set")

        if not self.THI_USERNAME:
            raise ValueError("THI_USERNAME is not set")

        if not self.THI_PASSWORD:
            raise ValueError("THI_PASSWORD is not set")

    def __check_deepL(self):
        """
        Checks the validity of the DeepL API key by attempting to translate a test text.
        If the API key is not valid, a ValueError is raised.

        Raises:
            ValueError: If the DeepL API key is not valid.
        """
        try:
            self.translator.translate_text("test", target_lang="EN-US")
        except Exception as e:
            print(self.DEEPL_API_KEY)
            raise ValueError("DeepL API key is not valid") from e

    def __open_session(self):
        """Opens a session with the THI API and returns the session id"""
        data = {
            "method": "open",
            "service": "session",
            "username": self.THI_USERNAME,
            "passwd": self.THI_PASSWORD,
            "format": "json",
        }

        session_req = requests.post(API_URL, data=data, timeout=5)
        return session_req.json()["data"][0]

    def __close_session(self):
        """Closes the session with the given session id"""
        data = {
            "method": "close",
            "service": "session",
            "session": self.session_id,
            "format": "json",
        }

        session_req = requests.post(API_URL, data=data, timeout=5)
        return session_req.json()["data"]

    def add_to_output(self, data, key):
        """Adds the data to the output"""
        self.output[key] = data

    def __get_lecturers(self):
        """Returns a list of all lecturers"""
        data = {
            "method": "lecturers",
            "service": "thiapp",
            "session": self.session_id,
            "format": "json",
            "from": "a",
            "to": "z",
        }

        lecturers_req = requests.post(API_URL, data=data, timeout=5)

        return lecturers_req.json()["data"][1]

    def __extract_all_functions(self, lecturers):
        """Extracts all functions from the lecturers"""
        functions = [
            lecturer["funktion"] for lecturer in lecturers if lecturer["funktion"] != ""
        ]

        # remove (in) or (r) from functions (e.g. Professor(in) -> Professor)
        functions = list(set(functions))
        cleaned_function = [GENDER_REGEX.sub("", function) for function in functions]

        return functions, cleaned_function

    def __translate(self, text):
        """Translates the function to english using the DeepL API"""
        results = {"de": text}

        for lang in LANGUAGES:
            result = self.translator.translate_text(text, target_lang=lang)
            results[lang.split("-", maxsplit=1)[0].lower()] = result.text

        return results

    def __translate_genders(self, text, cleaned_text):
        """
        Translates the function to english using the DeepL API
        The output dict will contain the original text and and use the cleaned text for the translation.
        """
        results = {"de": text}

        for lang in LANGUAGES:
            result = self.translator.translate_text(cleaned_text, target_lang=lang)
            results[lang.split("-")[0].lower()] = result.text

        return results

    def translate_room_functions(self):
        """Translates the map properties to english using the DeepL API"""
        response = requests.get(MAP_URL, timeout=5)
        data = response.json()["features"]

        results = {}

        room_properties = [
            {
                "en": CLEAN_REGEX.sub(" ", feature["properties"]["Funktion_en"]),
                "de": CLEAN_REGEX.sub(" ", feature["properties"]["Funktion_de"]),
            }
            for feature in data
        ]

        for room_keys in room_properties:
            results[room_keys["de"]] = room_keys

        results = {key: value for key, value in results.items() if key != ""}

        return list(results.items())

    def translate_lecturer_functions(self):
        """
        Extracts all functions from the lecturers and translates them to english.
        Returns a dict with the original functions and the translated functions nested in a dict with the language as key.
        """

        lecturers = self.__get_lecturers()
        functions, cleaned_functions = self.__extract_all_functions(lecturers)

        translated = [
            self.__translate_genders(function, cleaned)
            for function, cleaned in zip(functions, cleaned_functions)
        ]

        return dict(zip(functions, translated))

    def translate_lecturer_organizations(self):
        """
        Extracts all organizations from the lecturers and translates them to english.
        Returns a dict with the original organizations and the translated organizations nested in a dict with the language as key.
        """

        lecturers = self.__get_lecturers()
        organizations = [
            lecturer["organisation"]
            for lecturer in lecturers
            if lecturer["organisation"] != ""
        ]
        organizations = [lecturer for lecturer in organizations if lecturer is not None]
        organizations = list(set(organizations))

        translated = [self.__translate(organization) for organization in organizations]

        return dict(zip(organizations, translated.items()))

    def close(self):
        """Closes the session"""
        self.__close_session()

        print(f'Closed session with id "{self.session_id}"')

    def save_file(self, data, name):
        """Saves the data to a file with the given name"""

    def export_files(self):
        """Creates to localizations files for each language"""
        languages = LANGUAGES + ["DE"]

        for lang in languages:
            lang_short = lang.split("-")[0].lower()

            content = {
                "__source": "Generated using the thi-translator script",
                "apiTranslations": {},
            }

            for key, items in self.output.items():
                content["apiTranslations"][key] = {}
                for item_key, value in items:
                    content["apiTranslations"][key][item_key] = value[lang_short]

            with open(
                MAIN_DIR / lang_short / "api-translations.json", "w+", encoding="utf-8"
            ) as f:
                f.write(
                    json.dumps(content, indent=4, ensure_ascii=False, sort_keys=True)
                )


def main():
    translator = ThiTranslator()

    # Functions
    translator.add_to_output(
        translator.translate_lecturer_functions(), "lecturerFunctions"
    )

    # Organizations
    translator.add_to_output(
        translator.translate_lecturer_organizations(), "lecturerOrganizations"
    )

    # Map
    translator.add_to_output(
        translator.translate_room_functions(), "roomFunctions"
    )

    translator.close()
    translator.export_files()


if __name__ == "__main__":
    main()
