
import os

file_path = r'd:\code_arena\spring_boot\src\main\java\com\codegym\spring_boot\service\impl\ModeratorDashboardService.java'
with open(file_path, 'rb') as f:
    lines = f.readlines()
    for i in range(128, 140):
        print(f"Line {i+1}: {repr(lines[i])}")
