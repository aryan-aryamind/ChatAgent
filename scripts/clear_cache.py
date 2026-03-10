import shutil
import os

paths_to_delete = [
    r'd:\Chatbase-Clone\.next',
    r'd:\Chatbase-Clone\src\pages',
    r'd:\Chatbase-Clone\src\lib\scraper'
]

for path in paths_to_delete:
    if os.path.exists(path):
        print(f"Deleting {path}...")
        try:
            shutil.rmtree(path)
            print(f"Deleted {path} successfully.")
        except Exception as e:
            print(f"Error deleting {path}: {e}")
    else:
        print(f"{path} does not exist.")
