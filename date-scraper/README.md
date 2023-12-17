# Date Scraper

This is a tool to scrape the dates from a pdf and parse them into a usable json

## Usage

```console
cargo run -- /path/to/input.pdf /path/to/output.json
```

this will compile the program (if there are changes since the laste time it was compiled) and run it

this will compile it in a debug build, to compile it in release, use

```console
cargo run -r -- /path/to/input.pdf /path/to/output.json
```
