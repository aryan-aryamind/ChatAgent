import os

file_path = "verify_logic_results.txt"
if os.path.exists(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # Try decoding as UTF-16LE then UTF-8
    try:
        text = content.decode('utf-16')
    except:
        try:
            text = content.decode('utf-8')
        except:
            text = str(content)
            
    print(text)
else:
    print("File not found")
