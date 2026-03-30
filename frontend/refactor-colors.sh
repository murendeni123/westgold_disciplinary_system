#!/bin/bash

# Comprehensive color refactoring script
# This script replaces all hardcoded Tailwind color classes with theme-based classes

echo "Starting color refactoring..."

# Find all TSX and TS files
FILES=$(find src -type f \( -name "*.tsx" -o -name "*.ts" \) ! -path "*/node_modules/*")

for file in $FILES; do
  # Replace bg-orange with bg-primary
  sed -i '' 's/bg-orange-[0-9]\+/bg-primary/g' "$file"
  
  # Replace bg-green with bg-primary
  sed -i '' 's/bg-green-[0-9]\+/bg-primary/g' "$file"
  
  # Replace bg-blue with bg-secondary
  sed -i '' 's/bg-blue-[0-9]\+/bg-secondary/g' "$file"
  
  # Replace bg-purple with bg-secondary
  sed -i '' 's/bg-purple-[0-9]\+/bg-secondary/g' "$file"
  
  # Replace bg-indigo with bg-secondary
  sed -i '' 's/bg-indigo-[0-9]\+/bg-secondary/g' "$file"
  
  # Replace bg-pink with bg-secondary
  sed -i '' 's/bg-pink-[0-9]\+/bg-secondary/g' "$file"
  
  # Replace bg-white with bg-surface
  sed -i '' 's/\bbg-white\b/bg-surface/g' "$file"
  
  # Replace bg-gray-50 and bg-gray-100 with bg-surface
  sed -i '' 's/bg-gray-50/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-100/bg-surface/g' "$file"
  
  # Replace bg-gray-200 and bg-gray-300 with bg-border
  sed -i '' 's/bg-gray-200/bg-border/g' "$file"
  sed -i '' 's/bg-gray-300/bg-border/g' "$file"
  
  # Replace text-gray-900, text-gray-800, text-gray-700 with text-text
  sed -i '' 's/text-gray-900/text-text/g' "$file"
  sed -i '' 's/text-gray-800/text-text/g' "$file"
  sed -i '' 's/text-gray-700/text-text/g' "$file"
  
  # Replace text-gray-600, text-gray-500 with text-muted
  sed -i '' 's/text-gray-600/text-muted/g' "$file"
  sed -i '' 's/text-gray-500/text-muted/g' "$file"
  
  # Replace text-orange with text-primary
  sed -i '' 's/text-orange-[0-9]\+/text-primary/g' "$file"
  
  # Replace text-green with text-primary
  sed -i '' 's/text-green-[0-9]\+/text-primary/g' "$file"
  
  # Replace text-blue with text-secondary
  sed -i '' 's/text-blue-[0-9]\+/text-secondary/g' "$file"
  
  # Replace text-purple with text-secondary
  sed -i '' 's/text-purple-[0-9]\+/text-secondary/g' "$file"
  
  # Replace border-gray with border-border
  sed -i '' 's/border-gray-[0-9]\+/border-border/g' "$file"
  
  # Replace from-orange with from-primary
  sed -i '' 's/from-orange-[0-9]\+/from-primary/g' "$file"
  
  # Replace from-green with from-primary
  sed -i '' 's/from-green-[0-9]\+/from-primary/g' "$file"
  
  # Replace from-blue with from-secondary
  sed -i '' 's/from-blue-[0-9]\+/from-secondary/g' "$file"
  
  # Replace from-purple with from-secondary
  sed -i '' 's/from-purple-[0-9]\+/from-secondary/g' "$file"
  
  # Replace from-indigo with from-secondary
  sed -i '' 's/from-indigo-[0-9]\+/from-secondary/g' "$file"
  
  # Replace to-orange with to-primary
  sed -i '' 's/to-orange-[0-9]\+/to-primary/g' "$file"
  
  # Replace to-green with to-primary
  sed -i '' 's/to-green-[0-9]\+/to-primary/g' "$file"
  
  # Replace to-blue with to-secondary
  sed -i '' 's/to-blue-[0-9]\+/to-secondary/g' "$file"
  
  # Replace to-purple with to-secondary
  sed -i '' 's/to-purple-[0-9]\+/to-secondary/g' "$file"
  
  # Replace to-indigo with to-secondary
  sed -i '' 's/to-indigo-[0-9]\+/to-secondary/g' "$file"
  
  # Replace to-pink with to-secondary
  sed -i '' 's/to-pink-[0-9]\+/to-secondary/g' "$file"
  
  # Replace via-orange with via-primary
  sed -i '' 's/via-orange-[0-9]\+/via-primary/g' "$file"
  
  # Replace via-green with via-primary
  sed -i '' 's/via-green-[0-9]\+/via-primary/g' "$file"
  
  # Replace via-blue with via-secondary
  sed -i '' 's/via-blue-[0-9]\+/via-secondary/g' "$file"
  
  # Replace via-purple with via-secondary
  sed -i '' 's/via-purple-[0-9]\+/via-secondary/g' "$file"
  
  # Replace via-pink with via-secondary
  sed -i '' 's/via-pink-[0-9]\+/via-secondary/g' "$file"
  
  # Replace hover states
  sed -i '' 's/hover:bg-orange-[0-9]\+/hover:bg-primary/g' "$file"
  sed -i '' 's/hover:bg-green-[0-9]\+/hover:bg-primary/g' "$file"
  sed -i '' 's/hover:bg-blue-[0-9]\+/hover:bg-secondary/g' "$file"
  sed -i '' 's/hover:bg-purple-[0-9]\+/hover:bg-secondary/g' "$file"
  sed -i '' 's/hover:bg-gray-[0-9]\+/hover:bg-border/g' "$file"
  
  # Replace ring colors
  sed -i '' 's/ring-orange-[0-9]\+/ring-primary/g' "$file"
  sed -i '' 's/ring-green-[0-9]\+/ring-primary/g' "$file"
  sed -i '' 's/ring-blue-[0-9]\+/ring-secondary/g' "$file"
  sed -i '' 's/ring-purple-[0-9]\+/ring-secondary/g' "$file"
  
  # Replace focus:ring colors
  sed -i '' 's/focus:ring-orange-[0-9]\+/focus:ring-primary/g' "$file"
  sed -i '' 's/focus:ring-green-[0-9]\+/focus:ring-primary/g' "$file"
  sed -i '' 's/focus:ring-blue-[0-9]\+/focus:ring-secondary/g' "$file"
  sed -i '' 's/focus:ring-purple-[0-9]\+/focus:ring-secondary/g' "$file"
done

echo "Color refactoring complete!"
echo "Files processed: $(echo "$FILES" | wc -l)"
