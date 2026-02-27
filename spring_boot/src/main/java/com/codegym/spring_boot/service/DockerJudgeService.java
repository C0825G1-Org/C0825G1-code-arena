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

    /**
     * Chấm bài bằng Docker container
     */
    public SubmissionResult judge(
            String language,
            String sourceCode,
            String problemId
    ) {
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
                                    new File("problems/" + problemId).getAbsolutePath(),
                                    testcaseVolume,
                                    AccessMode.ro
                            )
                    )
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

            // Đợi tối đa 30s (tổng cho tất cả testcases)
            dockerClient.waitContainerCmd(containerId).start().awaitStatusCode();

            // 5. Lấy log output
            String logs = dockerClient.logContainerCmd(containerId)
                    .withStdOut(true)
                    .withStdErr(true)
                    .exec(new JudgeUtils.LogContainerResultCallback())
                    .awaitCompletion()
                    .toString();

            // 6. Phân tích kết quả
            List<TestCaseResult> testResults = JudgeUtils.parseTestResults(logs, "problems/" + problemId);

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
                    finalStatus.equals("COMPILE_ERROR") ? logs : "Judging completed",
                    testResults,
                    0, 0
            );

        } catch (Exception e) {
            e.printStackTrace();
            return new SubmissionResult("RUNTIME_ERROR", e.getMessage(), new ArrayList<>(), 0, 0);
        } finally {
            // 7. Cleanup
            if (containerId != null) {
                try {
                    dockerClient.removeContainerCmd(containerId).withForce(true).exec();
                } catch (Exception e) {}
            }
            
            try {
                Path path = Path.of(submissionDir);
                if (Files.exists(path)) {
                    Files.walk(path)
                        .sorted(Comparator.reverseOrder())
                        .map(Path::toFile)
                        .forEach(File::delete);
                }
            } catch (IOException e) {}
        }
    }
}