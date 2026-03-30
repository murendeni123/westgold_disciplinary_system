#!/bin/bash

echo "Ensuring all headings use primary accent color..."

# Find all TSX files
ALL_FILES=$(find src -type f -name "*.tsx")

for file in $ALL_FILES; do
  # Replace common heading text color patterns with text-primary
  
  # h1, h2, h3 with text-gray, text-white, or text-text
  sed -i '' 's/<h1 className="\([^"]*\)text-gray-[0-9]*/<h1 className="\1text-primary/g' "$file"
  sed -i '' 's/<h2 className="\([^"]*\)text-gray-[0-9]*/<h2 className="\1text-primary/g' "$file"
  sed -i '' 's/<h3 className="\([^"]*\)text-gray-[0-9]*/<h3 className="\1text-primary/g' "$file"
  
  # Replace text-white in headings with text-primary (except in gradient backgrounds)
  sed -i '' 's/<h1 className="\([^"]*\)text-white/<h1 className="\1text-primary/g' "$file"
  sed -i '' 's/<h2 className="\([^"]*\)text-white/<h2 className="\1text-primary/g' "$file"
  sed -i '' 's/<h3 className="\([^"]*\)text-white/<h3 className="\1text-primary/g' "$file"
  
  # Replace text-text in headings with text-primary
  sed -i '' 's/text-xl font-bold text-text/text-xl font-bold text-primary/g' "$file"
  sed -i '' 's/text-2xl font-bold text-text/text-2xl font-bold text-primary/g' "$file"
  sed -i '' 's/text-3xl font-bold text-text/text-3xl font-bold text-primary/g' "$file"
  sed -i '' 's/text-4xl font-bold text-text/text-4xl font-bold text-primary/g' "$file"
  sed -i '' 's/text-lg font-bold text-text/text-lg font-bold text-primary/g' "$file"
  
  # Replace font-semibold headings
  sed -i '' 's/text-xl font-semibold text-text/text-xl font-semibold text-primary/g' "$file"
  sed -i '' 's/text-2xl font-semibold text-text/text-2xl font-semibold text-primary/g' "$file"
  sed -i '' 's/text-3xl font-semibold text-text/text-3xl font-semibold text-primary/g' "$file"
  sed -i '' 's/text-lg font-semibold text-text/text-lg font-semibold text-primary/g' "$file"
  
  # Dashboard titles and page headers
  sed -i '' 's/text-4xl font-extrabold text-text/text-4xl font-extrabold text-primary/g' "$file"
  sed -i '' 's/text-3xl font-extrabold text-text/text-3xl font-extrabold text-primary/g' "$file"
  sed -i '' 's/text-2xl font-extrabold text-text/text-2xl font-extrabold text-primary/g' "$file"
  
  # Section headings
  sed -i '' 's/font-bold text-text">/font-bold text-primary">/g' "$file"
  sed -i '' 's/font-semibold text-text">/font-semibold text-primary">/g' "$file"
done

echo "Fixed heading colors to use primary accent!"
echo "Files processed: $(echo "$ALL_FILES" | wc -l)"
