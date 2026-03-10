package com.codegym.spring_boot.service;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.api.command.CreateContainerResponse;
import com.github.dockerjava.api.model.AccessMode;
import com.github.dockerjava.api.model.Bind;
import com.github.dockerjava.api.model.HostConfig;
import com.github.dockerjava.api.model.Volume;
import com.codegym.spring_boot.dto.SubmissionResult;
import com.codegym.spring_boot.dto.TestCaseResult;
import com.codegym.spring_boot.util.JudgeUtils;
import com.codegym.spring_boot.entity.ProblemIOTemplate;
import com.codegym.spring_boot.repository.IProblemIOTemplateRepository;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Statistics;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class DockerJudgeService {

    @Autowired
    private DockerClient dockerClient;

    @org.springframework.beans.factory.annotation.Value("${storage.testcases.path:./data/testcases}")
    private String testcaseStoragePath;

    @Autowired
    private IProblemIOTemplateRepository ioTemplateRepository;

    /**
     * Chấm bài bằng Docker container
     */
    public SubmissionResult judge(
            String rawLanguage,
            String sourceCode,
            String problemId,
            Boolean isRunOnly,
            List<String> sampleFilenames) {

        String language = normalizeLanguage(rawLanguage);
        String submissionId = UUID.randomUUID().toString();
        String submissionDir = "temp-submissions/" + submissionId;
        log.info(">>> [JUDGE] Starting judge for problem {}, language {}. Temp dir: {}", problemId, language,
                submissionDir);
        String containerId = null;

        try {
            // 1. Tạo folder submission tạm
            Files.createDirectories(Path.of(submissionDir));

            // 2. Lưu source code vào file
            // Kiểm tra và trộn code với Template I/O nếu có
            String finalCode = sourceCode;
            try {
                Integer pId = Integer.parseInt(problemId);
                var templates = ioTemplateRepository.findByProblemId(pId);
                for (ProblemIOTemplate t : templates) {
                    if (normalizeLanguage(t.getLanguage().getName()).equals(language)) {
                        String template = t.getTemplateCode();
                        if (template != null && template.contains("// {{USER_CODE}}")) {
                            finalCode = template.replace("// {{USER_CODE}}", sourceCode);
                            log.info(">>> [JUDGE] Code merged with I/O template for language {}", language);
                        }
                        break;
                    }
                }
            } catch (Exception e) {
                log.warn(">>> [JUDGE] Error fetching/merging I/O template: {}", e.getMessage());
            }

            String fileName = JudgeUtils.getSourceFileName(language);
            Path sourcePath = Path.of(submissionDir, fileName);
            Files.writeString(sourcePath, finalCode);

            // 3. Cấu hình Docker
            String imageName = "judge-" + language;
            Volume appVolume = new Volume("/app");
            Volume testcaseVolume = new Volume("/testcases");

            String hostAppPath = new File(submissionDir).getAbsolutePath().replace("\\", "/");
            String hostTestcasePath = getProblemsPath(problemId).replace("\\", "/");

            // Xử lý isRunOnly: tạo thư mục tạm và copy riêng các sample test case
            if (Boolean.TRUE.equals(isRunOnly) && sampleFilenames != null && !sampleFilenames.isEmpty()) {
                String tempTestcaseDir = submissionDir + "/testcases";
                Files.createDirectories(Path.of(tempTestcaseDir));
                for (String inFileName : sampleFilenames) {
                    if (inFileName == null)
                        continue;
                    try {
                        String outFileName = inFileName.replace(".in", ".out");
                        Files.copy(Path.of(hostTestcasePath, inFileName), Path.of(tempTestcaseDir, inFileName));
                        Files.copy(Path.of(hostTestcasePath, outFileName), Path.of(tempTestcaseDir, outFileName));
                    } catch (Exception ex) {
                        log.warn(">>> [JUDGE] Cound not copy sample testcase file: {}", inFileName);
                    }
                }
                hostTestcasePath = new File(tempTestcaseDir).getAbsolutePath().replace("\\", "/");
            }

            log.info(">>> [JUDGE] hostAppPath: {}", hostAppPath);
            log.info(">>> [JUDGE] hostTestcasePath: {}", hostTestcasePath);

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(
                            new Bind(hostAppPath, appVolume, AccessMode.rw),
                            new Bind(hostTestcasePath, testcaseVolume, AccessMode.ro))
                    .withMemory(256 * 1024 * 1024L) // 256MB
                    .withMemorySwap(256 * 1024 * 1024L)
                    .withCpuCount(1L)
                    .withNetworkMode("none")
                    .withAutoRemove(false);

            // 4. Tạo và chạy container
            CreateContainerResponse container = dockerClient.createContainerCmd(imageName)
                    .withHostConfig(hostConfig)
                    .withTty(false)
                    .exec();

            containerId = container.getId();
            dockerClient.startContainerCmd(containerId).exec();

            // Đo memory TRONG KHI container đang chạy (chạy song song bằng thread riêng)
            final long[] memHolder = new long[] { 0 };
            final String finalContainerId = containerId;
            Thread statsThread = new Thread(() -> {
                try {
                    Thread.sleep(100); // Đợi 100ms cho container khởi động
                    dockerClient.statsCmd(finalContainerId).exec(
                            new ResultCallback.Adapter<Statistics>() {
                                @Override
                                public void onNext(Statistics object) {
                                    if (object != null && object.getMemoryStats() != null
                                            && object.getMemoryStats().getUsage() != null) {
                                        long mem = object.getMemoryStats().getUsage() / 1024;
                                        if (mem > memHolder[0])
                                            memHolder[0] = mem; // Lưu peak memory
                                    }
                                    try {
                                        close();
                                    } catch (Exception ignored) {
                                    }
                                }
                            }).awaitCompletion(5, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignored) {
                }
            });
            statsThread.setDaemon(true);
            statsThread.start();

            // Đo thời gian thực thi
            long startTime = System.currentTimeMillis();

            // Đợi container chạy xong (Thêm timeout 15s để tránh treo hệ thống)
            log.info(">>> [JUDGE] Waiting for container {} to finish...", containerId);
            dockerClient.waitContainerCmd(containerId).start().awaitCompletion(15,
                    java.util.concurrent.TimeUnit.SECONDS);

            long executionTimeMs = System.currentTimeMillis() - startTime;

            // Chờ stats thread kết thúc (tối đa 3s)
            try {
                statsThread.join(3000);
            } catch (Exception ignored) {
            }
            long memoryUsedKb = memHolder[0];

            // 5. Lấy log output
            log.info(">>> [JUDGE] Container {} finished. Fetching logs...", containerId);
            String logs = dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .exec(new JudgeUtils.LogContainerResultCallback())
                    .awaitCompletion()
                    .toString();
            log.debug(">>> [JUDGE] Raw logs length: {}", logs.length());

            // 6. Phân tích kết quả
            // 6. Phân tích kết quả - dùng đường dẫn tuyệt đối để đọc file expected output
            String absoluteProblemsPath = getProblemsPath(problemId);
            List<TestCaseResult> testResults = JudgeUtils.parseTestResults(logs, absoluteProblemsPath);

            String finalStatus = "ACCEPTED";
            for (TestCaseResult tr : testResults) {
                if (!tr.isPassed()) {
                    finalStatus = tr.getMessage();
                    break;
                }
            }

            if (testResults.isEmpty() && logs.contains("COMPILE_ERROR")) {
                finalStatus = "COMPILE_ERROR";
            } else if (testResults.isEmpty()) {
                finalStatus = "SYSTEM_ERROR";
            }

            return new SubmissionResult(
                    finalStatus,
                    !finalStatus.equals("ACCEPTED") ? logs : "Judging completed",
                    testResults,
                    executionTimeMs,
                    memoryUsedKb);

        } catch (Exception e) {
            log.error(">>> [JUDGE] Critical error during judging process: {}", e.getMessage(), e);
            return new SubmissionResult("RUNTIME_ERROR", e.getMessage(), new ArrayList<>(), 0, 0);
        } finally {
            // 7. Cleanup
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception e) {
                }
            }

            try {
                Path path = Path.of(submissionDir);
                if (Files.exists(path)) {
                    Files.walk(path)
                            .sorted(Comparator.reverseOrder())
                            .map(Path::toFile)
                            .forEach(File::delete);
                }
            } catch (IOException e) {
            }
        }
    }

    private String getProblemsPath(String problemId) {
        // Sử dụng đường dẫn đã cấu hình trong application.properties
        File problemDir = new File(testcaseStoragePath, "problem_" + problemId);
        String absPath = problemDir.getAbsolutePath();
        log.debug(">>> [JUDGE] Problem path for {}: {}", problemId, absPath);
        return absPath;
    }

    private String normalizeLanguage(String raw) {
        if (raw == null)
            return "unknown";
        String lower = raw.toLowerCase();
        if (lower.contains("cpp") || lower.contains("c++"))
            return "cpp";
        // IMPORTANT: Check "javascript"/"node" BEFORE "java"
        // because "javascript" contains "java" as a substring!
        if (lower.contains("javascript") || lower.contains("node"))
            return "js"; // Must match docker image name "judge-js"
        if (lower.contains("java"))
            return "java";
        if (lower.contains("python"))
            return "python";
        return lower.split(" ")[0];
    }
}