#!/bin/bash

# Refactor teacher pages
echo "Starting teacher pages color refactoring..."

TEACHER_FILES=$(find src/pages/teacher -type f -name "*.tsx")

for file in $TEACHER_FILES; do
  echo "Processing: $file"
  
  # Background colors
  sed -i '' 's/bg-orange-[0-9]\+/bg-primary/g' "$file"
  sed -i '' 's/bg-green-[0-9]\+/bg-primary/g' "$file"
  sed -i '' 's/bg-blue-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-[0-9]\+/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-[0-9]\+/bg-secondary/g' "$file"
  
  # Gradients
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
  
  # Text colors
  sed -i '' 's/text-orange-[0-9]\+/text-primary/g' "$file"
  sed -i '' 's/text-green-[0-9]\+/text-primary/g' "$file"
  sed -i '' 's/text-blue-[0-9]\+/text-secondary/g' "$file"
  sed -i '' 's/text-purple-[0-9]\+/text-secondary/g' "$file"
  
  # Hover states
  sed -i '' 's/hover:from-orange-[0-9]\+/hover:from-primary/g' "$file"
  sed -i '' 's/hover:from-blue-[0-9]\+/hover:from-secondary/g' "$file"
  sed -i '' 's/hover:to-indigo-[0-9]\+/hover:to-secondary/g' "$file"
  sed -i '' 's/hover:to-purple-[0-9]\+/hover:to-secondary/g' "$file"
  sed -i '' 's/hover:to-pink-[0-9]\+/hover:to-secondary/g' "$file"
  
  # Grays
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

# Refactor TeacherLayout
LAYOUT_FILE="src/layouts/TeacherLayout.tsx"
if [ -f "$LAYOUT_FILE" ]; then
  echo "Processing: $LAYOUT_FILE"
  sed -i '' 's/bg-orange-[0-9]\+/bg-primary/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-blue-[0-9]\+/bg-secondary/g' "$LAYOUT_FILE"
  sed -i '' 's/\bbg-white\b/bg-surface/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-gray-[0-9]\+/bg-surface/g' "$LAYOUT_FILE"
  sed -i '' 's/text-gray-900/text-text/g' "$LAYOUT_FILE"
  sed -i '' 's/text-gray-600/text-muted/g' "$LAYOUT_FILE"
  sed -i '' 's/border-gray-[0-9]\+/border-border/g' "$LAYOUT_FILE"
fi

echo "Teacher pages refactoring complete!"
echo "Files processed: $(echo "$TEACHER_FILES" | wc -l)"
