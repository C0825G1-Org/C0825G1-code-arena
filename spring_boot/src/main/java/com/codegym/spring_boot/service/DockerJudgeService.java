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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class DockerJudgeService {

    @Autowired
    private DockerClient dockerClient;

    @org.springframework.beans.factory.annotation.Value("${storage.testcases.path:./data/testcases}")
    private String testcaseStoragePath;

    /**
     * Chấm bài bằng Docker container
     */
    public SubmissionResult judge(
            String rawLanguage,
            String sourceCode,
            String problemId,
            Boolean isRunOnly) {
            String problemId
    ) {
        String language = normalizeLanguage(rawLanguage);
        String submissionId = UUID.randomUUID().toString();
        String submissionDir = "temp-submissions/" + submissionId;
        String containerId = null;

        try {
            // 1. Tạo folder submission tạm
            Files.createDirectories(Path.of(submissionDir));

            // 2. Lưu source code vào file
            String fileName = JudgeUtils.getSourceFileName(language);
            Path sourcePath = Path.of(submissionDir, fileName);
            Files.writeString(sourcePath, sourceCode);

            // 3. Cấu hình Docker
            String imageName = "judge-" + language;
            Volume appVolume = new Volume("/app");
            Volume testcaseVolume = new Volume("/testcases");

            HostConfig hostConfig = HostConfig.newHostConfig()
                    .withBinds(
                            new Bind(new File(submissionDir).getAbsolutePath(), appVolume, AccessMode.rw),
                            new Bind(
                                    getProblemsPath(problemId),
                                    new File(testcaseStoragePath + "/problem_" + problemId).getAbsolutePath(),
                                    testcaseVolume,
                                    AccessMode.ro))
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
            final long[] memHolder = new long[]{0};
            final String finalContainerId = containerId;
            Thread statsThread = new Thread(() -> {
                try {
                    Thread.sleep(100); // Đợi 100ms cho container khởi động
                    dockerClient.statsCmd(finalContainerId).exec(
                        new com.github.dockerjava.api.async.ResultCallback.Adapter<com.github.dockerjava.api.model.Statistics>() {
                            @Override
                            public void onNext(com.github.dockerjava.api.model.Statistics object) {
                                if (object != null && object.getMemoryStats() != null && object.getMemoryStats().getUsage() != null) {
                                    long mem = object.getMemoryStats().getUsage() / 1024;
                                    if (mem > memHolder[0]) memHolder[0] = mem; // Lưu peak memory
                                }
                                try { close(); } catch (Exception ignored) {}
                            }
                        }
                    ).awaitCompletion(5, java.util.concurrent.TimeUnit.SECONDS);
                } catch (Exception ignored) {}
            });
            statsThread.setDaemon(true);
            statsThread.start();

            // Đo thời gian thực thi
            long startTime = System.currentTimeMillis();

            // Đợi container chạy xong
            dockerClient.waitContainerCmd(containerId).start().awaitStatusCode();

            long executionTimeMs = System.currentTimeMillis() - startTime;

            // Chờ stats thread kết thúc (tối đa 3s)
            try { statsThread.join(3000); } catch (Exception ignored) {}
            long memoryUsedKb = memHolder[0];

            // 5. Lấy log output
            String logs = dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .exec(new JudgeUtils.LogContainerResultCallback())
                    .awaitCompletion()
                    .toString();

            // 6. Phân tích kết quả
            // Truyền cờ isRunOnly nếu cần lọc test case ở mức Parser (có thể mở rộng
            // JudgeUtils)
            List<TestCaseResult> testResults = JudgeUtils.parseTestResults(logs,
                    testcaseStoragePath + "/problem_" + problemId);
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
                    memoryUsedKb
            );
                    0, 0);

        } catch (Exception e) {
            e.printStackTrace();
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
        // Thử xem folder problems có ở CWD không (chạy từ root)
        File p1 = new File("problems/" + problemId);
        if (p1.exists()) return p1.getAbsolutePath();

        // Thử xem có ở folder cha không (chạy từ spring_boot/)
        File p2 = new File("../problems/" + problemId);
        if (p2.exists()) return p2.getAbsolutePath();

        // Fallback về giá trị mặc định nếu không thấy (để log báo lỗi sau này)
        return p1.getAbsolutePath();
    }

    private String normalizeLanguage(String raw) {
        if (raw == null) return "unknown";
        String lower = raw.toLowerCase();
        if (lower.contains("cpp") || lower.contains("c++")) return "cpp";
        if (lower.contains("java")) return "java";
        if (lower.contains("python")) return "python";
        if (lower.contains("javascript") || lower.contains("node") || lower.contains("js")) return "js";
        return lower.split(" ")[0];
    }
}