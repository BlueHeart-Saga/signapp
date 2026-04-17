
import os

file_path = r'c:\Sagadevan\SignApp\backend\routes\documents.py'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
modified = False

# We want to find the one around line 4345 (0-indexed 4344)
# Searching for the pattern in view_document
for i, line in enumerate(lines):
    if 'async def view_document' in line:
        # Search forward for the permission check
        for j in range(i + 1, i + 50):
            if 'if not is_owner and not is_recipient:' in lines[j]:
                # Found it!
                indent = lines[j][:lines[j].find('if')]
                lines[j] = f"{indent}is_admin = user.get('role') == 'admin'\n{indent}if not is_owner and not is_recipient and not is_admin:\n"
                modified = True
                break
    new_lines.append(line)
    if modified:
        # Continue with rest of file
        new_lines.extend(lines[i+1:])
        break

if modified:
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Successfully modified view_document permission check.")
else:
    print("Could not find the target pattern.")
