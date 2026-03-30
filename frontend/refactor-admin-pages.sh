#!/bin/bash

# Refactor admin pages only - focused approach
echo "Starting admin pages color refactoring..."

# Target only admin pages
ADMIN_FILES=$(find src/pages/admin -type f -name "*.tsx")

for file in $ADMIN_FILES; do
  echo "Processing: $file"
  
  # Background colors
  sed -i '' 's/bg-orange-50/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-100/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-200/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-300/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-400/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-500/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-600/bg-primary/g' "$file"
  sed -i '' 's/bg-orange-700/bg-primary/g' "$file"
  
  sed -i '' 's/bg-green-50/bg-primary/g' "$file"
  sed -i '' 's/bg-green-100/bg-primary/g' "$file"
  sed -i '' 's/bg-green-200/bg-primary/g' "$file"
  sed -i '' 's/bg-green-300/bg-primary/g' "$file"
  sed -i '' 's/bg-green-400/bg-primary/g' "$file"
  sed -i '' 's/bg-green-500/bg-primary/g' "$file"
  sed -i '' 's/bg-green-600/bg-primary/g' "$file"
  sed -i '' 's/bg-green-700/bg-primary/g' "$file"
  
  sed -i '' 's/bg-blue-50/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-100/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-200/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-300/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-400/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-500/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-600/bg-secondary/g' "$file"
  sed -i '' 's/bg-blue-700/bg-secondary/g' "$file"
  
  sed -i '' 's/bg-purple-50/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-100/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-200/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-300/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-400/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-500/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-600/bg-secondary/g' "$file"
  sed -i '' 's/bg-purple-700/bg-secondary/g' "$file"
  
  sed -i '' 's/bg-indigo-50/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-100/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-200/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-300/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-400/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-500/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-600/bg-secondary/g' "$file"
  sed -i '' 's/bg-indigo-700/bg-secondary/g' "$file"
  
  sed -i '' 's/bg-pink-50/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-100/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-200/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-300/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-400/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-500/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-600/bg-secondary/g' "$file"
  sed -i '' 's/bg-pink-700/bg-secondary/g' "$file"
  
  # Gradient from colors
  sed -i '' 's/from-orange-500/from-primary/g' "$file"
  sed -i '' 's/from-orange-600/from-primary/g' "$file"
  sed -i '' 's/from-green-500/from-primary/g' "$file"
  sed -i '' 's/from-green-600/from-primary/g' "$file"
  sed -i '' 's/from-blue-500/from-secondary/g' "$file"
  sed -i '' 's/from-blue-600/from-secondary/g' "$file"
  sed -i '' 's/from-purple-500/from-secondary/g' "$file"
  sed -i '' 's/from-purple-600/from-secondary/g' "$file"
  sed -i '' 's/from-indigo-500/from-secondary/g' "$file"
  sed -i '' 's/from-indigo-600/from-secondary/g' "$file"
  sed -i '' 's/from-pink-500/from-secondary/g' "$file"
  sed -i '' 's/from-pink-600/from-secondary/g' "$file"
  
  # Gradient to colors
  sed -i '' 's/to-orange-500/to-primary/g' "$file"
  sed -i '' 's/to-orange-600/to-primary/g' "$file"
  sed -i '' 's/to-green-500/to-primary/g' "$file"
  sed -i '' 's/to-green-600/to-primary/g' "$file"
  sed -i '' 's/to-blue-500/to-secondary/g' "$file"
  sed -i '' 's/to-blue-600/to-secondary/g' "$file"
  sed -i '' 's/to-blue-700/to-secondary/g' "$file"
  sed -i '' 's/to-purple-500/to-secondary/g' "$file"
  sed -i '' 's/to-purple-600/to-secondary/g' "$file"
  sed -i '' 's/to-purple-700/to-secondary/g' "$file"
  sed -i '' 's/to-indigo-500/to-secondary/g' "$file"
  sed -i '' 's/to-indigo-600/to-secondary/g' "$file"
  sed -i '' 's/to-indigo-700/to-secondary/g' "$file"
  sed -i '' 's/to-pink-500/to-secondary/g' "$file"
  sed -i '' 's/to-pink-600/to-secondary/g' "$file"
  sed -i '' 's/to-pink-700/to-secondary/g' "$file"
  
  # Gradient via colors
  sed -i '' 's/via-pink-300/via-secondary/g' "$file"
  sed -i '' 's/via-purple-300/via-secondary/g' "$file"
  sed -i '' 's/via-blue-300/via-secondary/g' "$file"
  
  # Text colors
  sed -i '' 's/text-orange-500/text-primary/g' "$file"
  sed -i '' 's/text-orange-600/text-primary/g' "$file"
  sed -i '' 's/text-green-500/text-primary/g' "$file"
  sed -i '' 's/text-green-600/text-primary/g' "$file"
  sed -i '' 's/text-blue-500/text-secondary/g' "$file"
  sed -i '' 's/text-blue-600/text-secondary/g' "$file"
  sed -i '' 's/text-purple-500/text-secondary/g' "$file"
  sed -i '' 's/text-purple-600/text-secondary/g' "$file"
  
  # Hover states
  sed -i '' 's/hover:from-orange-700/hover:from-primary/g' "$file"
  sed -i '' 's/hover:from-blue-700/hover:from-secondary/g' "$file"
  sed -i '' 's/hover:to-indigo-700/hover:to-secondary/g' "$file"
  sed -i '' 's/hover:to-purple-700/hover:to-secondary/g' "$file"
  sed -i '' 's/hover:to-pink-700/hover:to-secondary/g' "$file"
  
  # Replace bg-white with bg-surface
  sed -i '' 's/\bbg-white\b/bg-surface/g' "$file"
  
  # Replace gray backgrounds
  sed -i '' 's/bg-gray-50/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-100/bg-surface/g' "$file"
  sed -i '' 's/bg-gray-200/bg-border/g' "$file"
  sed -i '' 's/bg-gray-300/bg-border/g' "$file"
  
  # Replace text grays
  sed -i '' 's/text-gray-900/text-text/g' "$file"
  sed -i '' 's/text-gray-800/text-text/g' "$file"
  sed -i '' 's/text-gray-700/text-text/g' "$file"
  sed -i '' 's/text-gray-600/text-muted/g' "$file"
  sed -i '' 's/text-gray-500/text-muted/g' "$file"
  
  # Replace border grays
  sed -i '' 's/border-gray-100/border-border/g' "$file"
  sed -i '' 's/border-gray-200/border-border/g' "$file"
  sed -i '' 's/border-gray-300/border-border/g' "$file"
done

# Also refactor AdminLayout
LAYOUT_FILE="src/layouts/AdminLayout.tsx"
if [ -f "$LAYOUT_FILE" ]; then
  echo "Processing: $LAYOUT_FILE"
  
  sed -i '' 's/bg-orange-500/bg-primary/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-orange-600/bg-primary/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-blue-500/bg-secondary/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-blue-600/bg-secondary/g' "$LAYOUT_FILE"
  sed -i '' 's/\bbg-white\b/bg-surface/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-gray-50/bg-surface/g' "$LAYOUT_FILE"
  sed -i '' 's/bg-gray-100/bg-surface/g' "$LAYOUT_FILE"
  sed -i '' 's/text-gray-900/text-text/g' "$LAYOUT_FILE"
  sed -i '' 's/text-gray-600/text-muted/g' "$LAYOUT_FILE"
  sed -i '' 's/border-gray-200/border-border/g' "$LAYOUT_FILE"
fi

echo "Admin pages refactoring complete!"
echo "Files processed: $(echo "$ADMIN_FILES" | wc -l)"
