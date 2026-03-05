import os

file_path = "verify_logic_results.txt"
output_file = "simulation_full_answers.txt"

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
    with open(output_file, 'w', encoding='utf-8') as out:
        for i, part in enumerate(parts[1:], 1):
            out.write(f"\n--- ANSWER {i} ---\n")
            # Split on the next test marker or end
            answer = part.split("--- TEST")[0].strip()
            out.write(answer + "\n")
    print(f"Full answers written to {output_file}")
else:
    print("File not found")
