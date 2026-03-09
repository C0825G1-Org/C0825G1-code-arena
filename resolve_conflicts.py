import re

path = r'd:/code_arena/spring_boot/src/main/java/com/codegym/spring_boot/service/impl/ModeratorDashboardService.java'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Resolve leaderboard builder conflicts
# Pattern to match the git conflict block
pattern = r'<<<<<<< HEAD\s+(leaderboard\.add\(com\.codegym\.spring_boot\.dto\.moderator\.response\.MonitorDashboardResponse\.MonitorLeaderboardEntry\.builder\(\)\s+\.rank\(rank\+\+\)\s+\.userId\(p\.getUser\(\)\.getId\(\)\.longValue\(\)\)\s+\.username\(p\.getUser\(\)\.getUsername\(\)\)\s+\.fullname\(fullname\)\s+\.totalScore\(p\.getTotalScore\(\)\)\s+\.totalPenalty\(p\.getTotalPenalty\(\)\)\s+\.acRate\(Math\.round\(acRate \* 100\.0\) / 100\.0\)\s+\.status\(p\.getStatus\(\)\.name\(\)\)\s+\.isCameraViolating\(p\.getIsCameraViolating\(\)\)\s+\.build\(\)\);\s+)=======\s+(leaderboard\s+\.add\(com\.codegym\.spring_boot\.dto\.moderator\.response\.MonitorDashboardResponse\.MonitorLeaderboardEntry\s+\.builder\(\)\s+\.rank\(rank\+\+\)\s+\.userId\(p\.getUser\(\)\.getId\(\)\.longValue\(\)\)\s+\.username\(p\.getUser\(\)\.getUsername\(\)\)\s+\.fullname\(fullname\)\s+\.totalScore\(p\.getTotalScore\(\)\)\s+\.totalPenalty\(p\.getTotalPenalty\(\)\)\s+\.acRate\(Math\.round\(acRate \* 100\.0\) / 100\.0\)\s+\.build\(\)\);\s+)>>>>>>> [a-f0-9]+'

new_content = re.sub(pattern, r'\1', content)

# Check if anything replaced
if new_content == content:
    print("Conflict markers not found with exact pattern. Trying generic marker removal.")
    # Generic marker removal (selecting HEAD for these specific blocks)
    # This is risky if there are other conflicts, but here we know the file.
    # Actually, let's just do a string replace of the known blocks.
    
    # Block 1
    block1 = """<<<<<<< HEAD
            leaderboard.add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry.builder()
                    .rank(rank++)
                    .userId(p.getUser().getId().longValue())
                    .username(p.getUser().getUsername())
                    .fullname(fullname)
                    .totalScore(p.getTotalScore())
                    .totalPenalty(p.getTotalPenalty())
                    .acRate(Math.round(acRate * 100.0) / 100.0)
                    .status(p.getStatus().name())
                    .isCameraViolating(p.getIsCameraViolating())
                    .build());
=======
            leaderboard
                    .add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry
                            .builder()
                            .rank(rank++)
                            .userId(p.getUser().getId().longValue())
                            .username(p.getUser().getUsername())
                            .fullname(fullname)
                            .totalScore(p.getTotalScore())
                            .totalPenalty(p.getTotalPenalty())
                            .acRate(Math.round(acRate * 100.0) / 100.0)
                            .build());
>>>>>>> 6c93e54ff3dbb9659ab1b72a307826e29b49ad27"""
    
    rep1 = """            leaderboard.add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry.builder()
                    .rank(rank++)
                    .userId(p.getUser().getId().longValue())
                    .username(p.getUser().getUsername())
                    .fullname(fullname)
                    .totalScore(p.getTotalScore())
                    .totalPenalty(p.getTotalPenalty())
                    .acRate(Math.round(acRate * 100.0) / 100.0)
                    .status(p.getStatus().name())
                    .isCameraViolating(p.getIsCameraViolating())
                    .build());"""
    
    new_content = new_content.replace(block1, rep1)
    
    # Block 2
    block2 = """<<<<<<< HEAD
            leaderboard.add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry.builder()
                    .rank(rank++)
                    .userId(p.getUser().getId().longValue())
                    .username(p.getUser().getUsername())
                    .fullname(fullname)
                    .totalScore(p.getTotalScore())
                    .totalPenalty(p.getTotalPenalty())
                    .acRate(Math.round(acRate * 100.0) / 100.0)
                    .status(p.getStatus().name())
                    .isCameraViolating(p.getIsCameraViolating())
                    .build());
=======
            leaderboard
                    .add(com.codegym.spring_boot.dto.moderator.response.MonitorDashboardResponse.MonitorLeaderboardEntry
                            .builder()
                            .rank(rank++)
                            .userId(p.getUser().getId().longValue())
                            .username(p.getUser().getUsername())
                            .fullname(fullname)
                            .totalScore(p.getTotalScore())
                            .totalPenalty(p.getTotalPenalty())
                            .acRate(Math.round(acRate * 100.0) / 100.0)
                            .build());
>>>>>>> 6c93e54ff3dbb9659ab1b72a307826e29b49ad27"""
    
    new_content = new_content.replace(block2, rep1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print("Conflict resolved.")
