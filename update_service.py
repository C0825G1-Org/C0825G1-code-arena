
import os

file_path = r'd:\code_arena\spring_boot\src\main\java\com\codegym\spring_boot\service\impl\ModeratorDashboardService.java'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update getMonitorStats
old_block1 = '.acRate(Math.round(acRate * 100.0) / 100.0)'
new_block1 = '.acRate(Math.round(acRate * 100.0) / 100.0)\n                    .isCameraViolating(p.getIsCameraViolating())'

content = content.replace(old_block1, new_block1)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
