#!/usr/bin/env sh

# Move markdown files (except README) to docs/ directory
# for fire_volunteer_management/ and fire_dept_automation/

moved=false

for dir in fire_volunteer_management fire_dept_automation; do
  if [ -d "$dir" ]; then
    # Find .md files in the directory root (not in subdirectories, excluding README files)
    for file in "$dir"/*.md; do
      # Check if file exists and is not a README
      if [ -f "$file" ] && ! echo "$file" | grep -qiE 'README\.md$'; then
        # Create docs directory if it doesn't exist
        mkdir -p "$dir/docs"
        
        # Get just the filename
        filename=$(basename "$file")
        
        # Move the file
        echo "Moving $file to $dir/docs/$filename"
        git mv "$file" "$dir/docs/$filename" 2>/dev/null || mv "$file" "$dir/docs/$filename"
        
        # Stage the moved file
        git add "$dir/docs/$filename"
        
        moved=true
      fi
    done
  fi
done

if [ "$moved" = true ]; then
  echo "✓ Markdown files moved to docs/ directories"
fi
