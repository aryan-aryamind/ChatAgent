import os

file_path = "verify_results.txt"
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
            
    lines = text.split('\n')
    for line in lines:
        if "ERROR" in line or "Error" in line or "Exception" in line or "failed" in line or "empty" in line:
            print(line)
else:
    print("File not found")
