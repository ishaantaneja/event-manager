#!/bin/bash

# Output file
OUTPUT="project_dump.txt"

# Clear the file if it exists
> "$OUTPUT"

echo "=== PROJECT FILE STRUCTURE ===" >> "$OUTPUT"
tree src >> "$OUTPUT" 2>/dev/null || find src >> "$OUTPUT"

echo -e "\n\n=== FILE CONTENTS ===" >> "$OUTPUT"

# Loop through files in src and .env
for file in $(find src -type f; echo ".env"); do
    if [ -f "$file" ]; then
        echo -e "\n--- FILE: $file ---\n" >> "$OUTPUT"
        cat "$file" >> "$OUTPUT"
        echo -e "\n" >> "$OUTPUT"
    fi
done

echo "✅ Dump complete. Check $OUTPUT"
