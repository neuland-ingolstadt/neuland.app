use std::fs::File;
use std::io::{stdin, Write};
use std::process::exit;
use regex::Regex;
use serde::Serialize;

const DATE_REGEX: &str = r"\d{2}\.\d{2}\.\d{4}";
const TIME_REGEX: &str = r"(\d{1,2}(:\d{2})?)( Uhr)";
const JSON_FILE: &str = "../rogue-thi-app/data/calendar.json";

#[derive(Serialize, Debug)]
struct Date {
    name: String,
    begin: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "hasHours")]
    has_hours: Option<bool>
}

fn main() {
    let text = pdf_extract::extract_text("input.pdf").expect("The pd couldn't be parsed");

    let date_regex = Regex::new(DATE_REGEX).expect("The date regex isn't valid");
    let time_regex = Regex::new(TIME_REGEX).expect("The time regex isn't valid");

    let mut dates = Vec::new();

    // Sometimes what should be a single line is split over multiple
    let mut complete_line = String::new();
    for line in text.lines() {
        let line = line.trim();
        if !line.is_empty() &&
            !line.contains("Semestertermine für Ihr Studium") &&
            !line.contains("Wintersemester") &&
            !line.contains("Sommersemester") &&
            !line.contains("Einschreibung für")
        {
            complete_line.push_str(line);
            complete_line.push(' ');
            if date_regex.is_match(line) {
                dates.push(parse_date(&complete_line, &date_regex, &time_regex));
                complete_line = String::new();
            }
        }
    }

    let json = serde_json::to_string_pretty(&dates).expect("Dates couldnt be serialized");
    println!("{}", json);
    println!("\nPlease triple check if everything is correct");
    println!("Incorrect entries might get people in trouble.");
    let mut input = String::new();
    while !(input == "y" || input == "n") {
        input.clear();
        println!("Is it correct y/n");
        stdin().read_line(&mut input).expect("Couldn't read the line");
        input = input.trim().to_string();
    }

    if input == "y" {
        let mut file = File::create(JSON_FILE).expect("Couldn't open the json file");
        write!(file, "{}", json).expect("Couldn't write to the json file");
        println!("The json was saved to {}", JSON_FILE);
    } else {
        eprintln!("The file wasn't parsed correctly. Please input dates manually to the json or fix this program");
        exit(1);
    }
}

fn parse_date(date_string: &str, date_regex: &Regex, time_regex: &Regex) -> Date {
    let mut split = date_regex.split(date_string);
    let mut captures = date_regex.captures_iter(date_string);

    let name = String::from(split.next().expect("There is no name").trim().split("spätestens bis").next().expect("There is always something").trim());
    let mut begin = captures.next().expect("There is no begin date")[0].trim().split('.').rev().collect::<Vec<&str>>().join("-");
    let end = captures.next().map(|end| {
       end[0].trim().split('.').rev().collect::<Vec<&str>>().join("-")
    });
    let has_hours = if let Some(time) = time_regex.captures(date_string).map(|captures| captures[1].to_string()) {
        begin.push('T');
        begin.push_str(&time);
        if !time.contains(':') {
            begin.push_str(":00")
        }

        Some(true)
    } else {
        None
    };


    Date {
        name,
        begin,
        end,
        has_hours
    }
}