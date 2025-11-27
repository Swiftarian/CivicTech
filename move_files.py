import os
import shutil

source_dir = os.getcwd()
target_dir = os.path.join(source_dir, "fire_dept_automation")

if not os.path.exists(target_dir):
    os.makedirs(target_dir)

items = os.listdir(source_dir)
for item in items:
    if item == ".git" or item == "fire_dept_automation" or item == "move_files.py":
        continue
    
    src_path = os.path.join(source_dir, item)
    dst_path = os.path.join(target_dir, item)
    
    print(f"Moving {item} to {dst_path}")
    try:
        shutil.move(src_path, dst_path)
    except Exception as e:
        print(f"Error moving {item}: {e}")
