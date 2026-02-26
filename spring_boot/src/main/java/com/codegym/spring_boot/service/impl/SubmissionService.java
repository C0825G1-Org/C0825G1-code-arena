package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.JudgeTicket;
import com.codegym.spring_boot.dto.SubmitRequestDTO;
import com.codegym.spring_boot.entity.Language;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.Submission;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.SubmissionStatus;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.SubmissionRepository;
import com.codegym.spring_boot.service.IProblemService;
import com.codegym.spring_boot.service.ISubmissionService;
import com.codegym.spring_boot.service.JudgeQueueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService implements ISubmissionService {

    private final SubmissionRepository submissionRepository;
    private final JudgeQueueService judgeQueueService;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Integer submitCode(SubmitRequestDTO submitRequestDTO) {
        log.info("Receiving new code submission for problem ID: {}", submitRequestDTO.getProblemId());

        // 1. Get current user from Security Context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        if (authentication != null && authentication.isAuthenticated()
                && !authentication.getPrincipal().equals("anonymousUser")) {
            String username = authentication.getName();
            user = userRepository.findByUsernameAndIsDeletedFalse(username)
                    .orElseThrow(() -> new RuntimeException("Current user not found"));
        } else {
            // TODO: Fallback to a hardcoded user if Auth (Dev 1) is not fully integrated
            // yet for testing
            log.warn("User is not authenticated. Falling back to default user ID = 1");
            user = userRepository.findById(1)
                    .orElseThrow(() -> new RuntimeException("Default user not found"));
        }

        // 2. Prepare dependencies (Using dummy instances for problem and language just
        // to hold IDs for saving foreign keys, ideally we should fetch them)
        // Note: For a real stable application, fetch the Problem and Language to ensure
        // they exist before inserting.
        Problem problemReference = new Problem();
        problemReference.setId(submitRequestDTO.getProblemId());

        Language languageReference = new Language();
        languageReference.setId(submitRequestDTO.getLanguageId());

        // 3. Save Submission to DB with PENDING status
        Submission newSubmission = Submission.builder()
                .user(user)
                .problem(problemReference)
                .language(languageReference)
                .sourceCode(submitRequestDTO.getSourceCode())
                .status(SubmissionStatus.pending)
                .executionTime(0)
                .memoryUsed(0)
                .score(0)
                .build();

        Submission savedSubmission = submissionRepository.save(newSubmission);
        log.info("Saved submission to DB with ID: {}", savedSubmission.getId());

        // 4. Push ticket to Redis Queue for the Judge Engine (Dev 3) to pick up
        JudgeTicket ticket = new JudgeTicket(
                savedSubmission.getId(),
                submitRequestDTO.getProblemId(),
                submitRequestDTO.getLanguageId());
        judgeQueueService.pushTicketToQueue(ticket);

        return savedSubmission.getId();
    }
}
