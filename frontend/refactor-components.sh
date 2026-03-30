#!/bin/bash

# Refactor components and other pages
echo "Starting components and remaining pages color refactoring..."

# Components
COMPONENT_FILES=$(find src/components -type f -name "*.tsx")

for file in $COMPONENT_FILES; do
  echo "Processing: $file"
  
  sed -i '' 's/bg-orange-[0-9]\+/bg-primary/g' "$file"
  sed -i '' 's/bg-green-[0-9]\+/bg-primary/g' "$file"
  sed -i '' 's/bg-blue-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-[0-9]\+/bg-secondary/g' "$file"
  
  sed -i '' 's/from-orange-[0-9]\+/from-primary/g' "$file"
  sed -i '' 's/from-green-[0-9]\+/from-primary/g' "$file"
  sed -i '' 's/from-blue-[0-9]\+/from-secondary/g' "$file"
  sed -i '' 's/from-purple-[0-9]\+/from-secondary/g' "$file"
  sed -i '' 's/from-indigo-[0-9]\+/from-secondary/g' "$file"
  sed -i '' 's/from-pink-[0-9]\+/from-secondary/g' "$file"
  
  sed -i '' 's/to-orange-[0-9]\+/to-primary/g' "$file"
  sed -i '' 's/to-green-[0-9]\+/to-primary/g' "$file"
  sed -i '' 's/to-blue-[0-9]\+/to-secondary/g' "$file"
  sed -i '' 's/to-purple-[0-9]\+/to-secondary/g' "$file"
  sed -i '' 's/to-indigo-[0-9]\+/to-secondary/g' "$file"
  sed -i '' 's/to-pink-[0-9]\+/to-secondary/g' "$file"
  
  sed -i '' 's/via-pink-[0-9]\+/via-secondary/g' "$file"
  sed -i '' 's/via-purple-[0-9]\+/via-secondary/g' "$file"
  sed -i '' 's/via-blue-[0-9]\+/via-secondary/g' "$file"
  
  sed -i '' 's/text-orange-[0-9]\+/text-primary/g' "$file"
  sed -i '' 's/text-green-[0-9]\+/text-primary/g' "$file"
  sed -i '' 's/text-blue-[0-9]\+/text-secondary/g' "$file"
  sed -i '' 's/text-purple-[0-9]\+/text-secondary/g' "$file"
  
  sed -i '' 's/hover:from-orange-[0-9]\+/hover:from-primary/g' "$file"
  sed -i '' 's/hover:from-blue-[0-9]\+/hover:from-secondary/g' "$file"
  sed -i '' 's/hover:to-indigo-[0-9]\+/hover:to-secondary/g' "$file"
  sed -i '' 's/hover:to-purple-[0-9]\+/hover:to-secondary/g' "$file"
  sed -i '' 's/hover:to-pink-[0-9]\+/hover:to-secondary/g' "$file"
  
  sed -i '' 's/\bbg-white\b/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-50/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-100/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-200/bg-border/g' "$file"
  sed -i '' 's/bg-gray-300/bg-border/g' "$file"
  sed -i '' 's/text-gray-900/text-text/g' "$file"
  sed -i '' 's/text-gray-800/text-text/g' "$file"
  sed -i '' 's/text-gray-700/text-text/g' "$file"
  sed -i '' 's/text-gray-600/text-muted/g' "$file"
  sed -i '' 's/text-gray-500/text-muted/g' "$file"
  sed -i '' 's/border-gray-[0-9]\+/border-border/g' "$file"
done

# Root pages (Login, SchoolLogin, SchoolSelect, etc.)
ROOT_PAGES=$(find src/pages -maxdepth 1 -type f -name "*.tsx")

for file in $ROOT_PAGES; do
  echo "Processing: $file"
  
  sed -i '' 's/bg-orange-[0-9]\+/bg-primary/g' "$file"
  sed -i '' 's/bg-green-[0-9]\+/bg-primary/g' "$file"
  sed -i '' 's/bg-blue-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-[0-9]\+/bg-secondary/g' "$file"
  
  sed -i '' 's/from-orange-[0-9]\+/from-primary/g' "$file"
  sed -i '' 's/from-green-[0-9]\+/from-primary/g' "$file"
  sed -i '' 's/from-blue-[0-9]\+/from-secondary/g' "$file"
  sed -i '' 's/from-purple-[0-9]\+/from-secondary/g' "$file"
  sed -i '' 's/from-indigo-[0-9]\+/from-secondary/g' "$file"
  sed -i '' 's/from-pink-[0-9]\+/from-secondary/g' "$file"
  
  sed -i '' 's/to-orange-[0-9]\+/to-primary/g' "$file"
  sed -i '' 's/to-green-[0-9]\+/to-primary/g' "$file"
  sed -i '' 's/to-blue-[0-9]\+/to-secondary/g' "$file"
  sed -i '' 's/to-purple-[0-9]\+/to-secondary/g' "$file"
  sed -i '' 's/to-indigo-[0-9]\+/to-secondary/g' "$file"
  sed -i '' 's/to-pink-[0-9]\+/to-secondary/g' "$file"
  
  sed -i '' 's/via-pink-[0-9]\+/via-secondary/g' "$file"
  sed -i '' 's/via-purple-[0-9]\+/via-secondary/g' "$file"
  sed -i '' 's/via-blue-[0-9]\+/via-secondary/g' "$file"
  
  sed -i '' 's/text-orange-[0-9]\+/text-primary/g' "$file"
  sed -i '' 's/text-green-[0-9]\+/text-primary/g' "$file"
  sed -i '' 's/text-blue-[0-9]\+/text-secondary/g' "$file"
  sed -i '' 's/text-purple-[0-9]\+/text-secondary/g' "$file"
  
  sed -i '' 's/\bbg-white\b/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-50/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-100/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-200/bg-border/g' "$file"
  sed -i '' 's/bg-gray-300/bg-border/g' "$file"
  sed -i '' 's/text-gray-900/text-text/g' "$file"
  sed -i '' 's/text-gray-800/text-text/g' "$file"
  sed -i '' 's/text-gray-700/text-text/g' "$file"
  sed -i '' 's/text-gray-600/text-muted/g' "$file"
  sed -i '' 's/text-gray-500/text-muted/g' "$file"
  sed -i '' 's/border-gray-[0-9]\+/border-border/g' "$file"
done

echo "Components and remaining pages refactoring complete!"
echo "Component files processed: $(echo "$COMPONENT_FILES" | wc -l)"
echo "Root page files processed: $(echo "$ROOT_PAGES" | wc -l)"
