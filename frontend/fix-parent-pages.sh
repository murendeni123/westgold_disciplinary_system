#!/bin/bash

echo "Fixing all hardcoded light colors in parent pages..."

# Find all parent page files
PARENT_FILES=$(find src/pages/parent -type f -name "*.tsx")

for file in $PARENT_FILES; do
  echo "Processing: $file"
  
  # Replace all bg-white with bg-surface
  sed -i '' 's/bg-white/bg-surface/g' "$file"
  
  # Replace light gray backgrounds
  sed -i '' 's/bg-gray-50/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-100/bg-surface/g' "$file"
  
  # Replace light colored backgrounds
  sed -i '' 's/bg-amber-50/bg-surface/g' "$file"
  sed -i '' 's/bg-yellow-50/bg-surface/g' "$file"
  sed -i '' 's/bg-red-50/bg-surface/g' "$file"
  sed -i '' 's/bg-emerald-50/bg-surface/g' "$file"
  sed -i '' 's/bg-green-50/bg-surface/g' "$file"
  sed -i '' 's/bg-blue-50/bg-surface/g' "$file"
  sed -i '' 's/bg-indigo-50/bg-surface/g' "$file"
  sed -i '' 's/bg-purple-50/bg-surface/g' "$file"
  sed -i '' 's/bg-pink-50/bg-surface/g' "$file"
  sed -i '' 's/bg-rose-50/bg-surface/g' "$file"
  sed -i '' 's/bg-cyan-50/bg-surface/g' "$file"
  sed -i '' 's/bg-teal-50/bg-surface/g' "$file"
  
  # Replace gradient backgrounds
  sed -i '' 's/from-amber-50/from-surface/g' "$file"
  sed -i '' 's/from-yellow-50/from-surface/g' "$file"
  sed -i '' 's/from-red-50/from-surface/g' "$file"
  sed -i '' 's/from-rose-50/from-surface/g' "$file"
  sed -i '' 's/from-blue-50/from-surface/g' "$file"
  sed -i '' 's/from-indigo-50/from-surface/g' "$file"
  sed -i '' 's/to-amber-50/to-surface/g' "$file"
  sed -i '' 's/to-yellow-50/to-surface/g' "$file"
  sed -i '' 's/to-red-50/to-surface/g' "$file"
  sed -i '' 's/to-rose-50/to-surface/g' "$file"
  sed -i '' 's/to-blue-50/to-surface/g' "$file"
  sed -i '' 's/to-indigo-50/to-surface/g' "$file"
  sed -i '' 's/to-cyan-50/to-surface/g' "$file"
  
  # Replace hover states
  sed -i '' 's/hover:bg-amber-50/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-yellow-50/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-red-50/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-gray-50/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-gray-100/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-blue-50/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-indigo-50/hover:bg-border/g' "$file"
  
  # Replace white borders
  sed -i '' 's/border-white\/20/border-border/g' "$file"
  sed -i '' 's/border-white\/30/border-border/g' "$file"
  
  # Replace hover white backgrounds
  sed -i '' 's/hover:bg-white\/50/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-white\/30/hover:bg-border/g' "$file"
  sed -i '' 's/hover:bg-white\/20/hover:bg-border/g' "$file"
done

echo "Fixed all hardcoded light colors in parent pages!"
echo "Files processed: $(echo "$PARENT_FILES" | wc -l)"
