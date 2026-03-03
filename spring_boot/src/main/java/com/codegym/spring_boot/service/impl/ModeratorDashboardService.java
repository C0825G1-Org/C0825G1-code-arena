package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.contest.response.ContestListResponse;
import com.codegym.spring_boot.dto.moderator.response.ModeratorDashboardResponse;
import com.codegym.spring_boot.entity.Contest;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import com.codegym.spring_boot.repository.ContestParticipantRepository;
import com.codegym.spring_boot.repository.ContestProblemRepository;
import com.codegym.spring_boot.repository.ContestRepository;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.IModeratorDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ModeratorDashboardService implements IModeratorDashboardService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository contestParticipantRepository;
    private final SubmissionRepository submissionRepository;
    private final IProblemRepository problemRepository;
    private final ContestProblemRepository contestProblemRepository;

    @Override
    public ModeratorDashboardResponse getDashboardStats(Integer moderatorId) {

        long totalParticipants = contestParticipantRepository.countTotalParticipantsByModId(moderatorId);
        long totalContests = contestRepository.countByCreatedById(moderatorId);
        
        LocalDateTime cutoff24h = LocalDateTime.now().minusDays(1);
        long submissionsLast24h = submissionRepository.countSubmissionsForModRecent(moderatorId, cutoff24h);
        
        long pendingProblems = problemRepository.countPendingProblemsByCreator(moderatorId);

        Pageable top5Active = PageRequest.of(0, 5, Sort.by("startTime").descending());
        Page<Contest> activeContestPage = contestRepository.findByCreatedByIdAndStatus(moderatorId, ContestStatus.active, top5Active);
        
        List<ContestListResponse> activeContests = activeContestPage.getContent().stream().map(c -> {
            Integer firstProblemId = null;
            var problems = contestProblemRepository.findByIdContestIdOrderByOrderIndexAsc(c.getId());
            if (problems != null && !problems.isEmpty()) {
                firstProblemId = problems.get(0).getProblem().getId();
            }

            return ContestListResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .status(c.getStatus().name())
                .startTime(c.getStartTime())
                .endTime(c.getEndTime())
                .participantCount(contestParticipantRepository.countByIdContestId(c.getId()))
                .serverTime(LocalDateTime.now())
                .isRegistered(false)
                .firstProblemId(firstProblemId)
                .build();
        }).collect(Collectors.toList());

        return ModeratorDashboardResponse.builder()
                .totalParticipants(totalParticipants)
                .totalContests(totalContests)
                .submissionsLast24h(submissionsLast24h)
                .pendingProblems(pendingProblems)
                .activeContests(activeContests)
                .build();
    }
}
