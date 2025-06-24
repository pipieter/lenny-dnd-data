# Lenny D&D Bot Data

Generate the data for the Lenny D&D bot. Automatically formats the descriptions for the Discord embeds.

### Dev Comments

Since the json files are generated on both Linux and Windows, git will flag changes on Windows devices whenever running the generation script.
This is related to Linux using LF and Windows using CRLF, to ignore this you can configure git to ignore autocrlf: `git config --global core.autocrlf false`.
