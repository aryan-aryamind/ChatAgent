import os

file_path = "verify_logic_results.txt"
if os.path.exists(file_path):
    with open(file_path, 'rb') as f:
        content = f.read()
    
    try:
        text = content.decode('utf-16')
    except:
        try:
            text = content.decode('utf-8')
        except:
            text = str(content)
            
    # Find the answers
    parts = text.split("ANSWER:")
    for i, part in enumerate(parts[1:], 1):
        print(f"\n--- ANSWER {i} ---")
        # Split on the next test marker or end
        answer = part.split("--- TEST")[0].strip()
        print(answer)
else:
    print("File not found")
