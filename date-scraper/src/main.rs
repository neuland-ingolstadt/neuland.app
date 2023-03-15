use regex::Regex;
use serde::Serialize;
use std::env::args;
use std::fs::File;
use std::io::{stdin, Write};
use std::process::exit;

/// The regex string to match dates
const DATE_REGEX: &str = r"\d{2}\.\d{2}\.\d{4}";
/// The regex string to match times
const TIME_REGEX: &str = r"(\d{1,2}(:\d{2})?)( Uhr)";

/// The struct dates are saved in before serializing to json
#[derive(Serialize, Debug)]
struct Date {
    name: String,
    begin: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    #[serde(rename = "hasHours")]
    has_hours: Option<bool>,
}

fn main() {
    // Get cli arguments
    let mut arguments = args();
    let input_file = arguments.nth(1).expect("No input file was specified");
    let output_file = arguments.next().expect("No output file was specified");

    // get the text from the pdf
    let text = pdf_extract::extract_text(&input_file).expect("The pd couldn't be parsed");

    // Create the regexes
    let date_regex = Regex::new(DATE_REGEX).expect("The date regex isn't valid");
    let time_regex = Regex::new(TIME_REGEX).expect("The time regex isn't valid");

    // Initialize a vec to save dates
    let mut dates = Vec::new();

    // Sometimes what should be a single line is split over multiple. So this string is used to collect those into a single line
    let mut complete_line = String::new();
    for line in text.lines() {
        let line = line.trim();

        // There are a bunch of lines that should be ignored
        if !line.is_empty()
            && !line.contains("Semestertermine für Ihr Studium")
            && !line.contains("Wintersemester")
            && !line.contains("Sommersemester")
            && !line.contains("Einschreibung für")
        {
            complete_line.push_str(line);
            complete_line.push(' ');

            // If there is a date in the line, there won't be a next line for this entry
            if date_regex.is_match(line) {
                // Parse the date and save it
                dates.push(parse_date(&complete_line, &date_regex, &time_regex));
                // clear the line
                complete_line = String::new();
            }
        }
    }

    // serialize the dates
    let json = serde_json::to_string_pretty(&dates).expect("Dates couldnt be serialized");

    // Print the json to make sure its correct
    println!("{}", json);
    println!("\nPlease triple check if everything is correct");
    println!("Incorrect entries might get people in trouble.");

    let mut file = File::create(&output_file).expect("Couldn't open the json file");
    write!(file, "{}", json).expect("Couldn't write to the json file");
    println!("The json was saved to {}", output_file);
}

/// Parse the given string into a date by using the given regexes
fn parse_date(date_string: &str, date_regex: &Regex, time_regex: &Regex) -> Date {
    // get the parts of the string without the date
    let mut split = date_regex.split(date_string);
    // get the dates in the string
    let mut captures = date_regex.captures_iter(date_string);

    // save the part of the string without name as name
    let name = String::from(
        split
            .next()
            .expect("There is no name")
            .trim()
            // The spätestens bis part should not be included
            .split("spätestens bis")
            .next()
            .expect("There is always something")
            .trim(),
    );

    // parse the begin date
    let mut begin = captures.next().expect("There is no begin date")[0]
        .trim()
        .split('.')
        .rev()
        .collect::<Vec<&str>>()
        .join("-");

    // parse the end date, if it exists
    let end = captures.next().map(|end| {
        end[0]
            .trim()
            .split('.')
            .rev()
            .collect::<Vec<&str>>()
            .join("-")
    });

    let has_hours = if let Some(time) = time_regex
        .captures(date_string)
        .map(|captures| captures[1].to_string())
    {
        // if there is a time, add it to the begin date
        begin.push('T');
        begin.push_str(&time);
        if !time.contains(':') {
            begin.push_str(":00")
        }

        // and set has_hours to true
        Some(true)
    } else {
        None
    };

    Date {
        name,
        begin,
        end,
        has_hours,
    }
}
