package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.testcase.TestCaseRequestDTO;
import com.codegym.spring_boot.dto.testcase.TestCaseResponseDTO;
import com.codegym.spring_boot.entity.Problem;
import com.codegym.spring_boot.entity.TestCase;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.enums.TestCaseStatus;
import com.codegym.spring_boot.entity.enums.UserRole;
import com.codegym.spring_boot.repository.IProblemRepository;
import com.codegym.spring_boot.repository.ITestCaseRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.ContestProblemRepository;
import com.codegym.spring_boot.service.ContestService;
import com.codegym.spring_boot.service.ITestCaseService;
import com.codegym.spring_boot.entity.ContestProblem;
import com.codegym.spring_boot.entity.enums.ContestStatus;
import jakarta.persistence.NoResultException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.springframework.web.multipart.MultipartFile;
import com.codegym.spring_boot.dto.testcase.ZipUploadResponseDTO;

@Service
public class TestCaseService implements ITestCaseService {

    private final ITestCaseRepository testCaseRepository;
    private final IProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ContestService contestService;

    @Value("${storage.testcases.path:./data/testcases}")
    private String storagePathBase;

    public TestCaseService(ITestCaseRepository testCaseRepository, 
                           IProblemRepository problemRepository, 
                           UserRepository userRepository,
                           ContestProblemRepository contestProblemRepository,
                           ContestService contestService) {
        this.testCaseRepository = testCaseRepository;
        this.problemRepository = problemRepository;
        this.userRepository = userRepository;
        this.contestProblemRepository = contestProblemRepository;
        this.contestService = contestService;
    }

    @Override
    @Transactional
    public TestCaseResponseDTO createTestCase(Integer problemId, TestCaseRequestDTO requestDTO) {
        // 1. Tìm thông tin Problem
        Problem problem = problemRepository.findById(problemId)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + problemId));

        // 2. Phân quyền (chỉ ADMIN hoặc OWNER tạo mới được)
        checkModifyPermission(problem);
        checkIfProblemInActiveContest(problemId);

        // 3. Tạo TestCase Entity
        TestCase testCase = new TestCase();
        testCase.setProblem(problem);
        testCase.setIsSample(requestDTO.getIsSample());
        testCase.setScoreWeight(requestDTO.getScoreWeight());

        testCase.setSampleInput(requestDTO.getInputContent());
        testCase.setSampleOutput(requestDTO.getOutputContent());

        // --- TÍNH TOÁN TÊN FILE (Thực hiện TRƯỚC khi save data mới) ---
        // TestCase lastTestCase = testCaseRepository.findLastTestCaseByProblemId(problemId);
        TestCase lastTestCase = testCaseRepository.findFirstByProblemIdOrderByIdDesc(problemId);
        int nextNumber = 1;
        
        if (lastTestCase != null && lastTestCase.getInputFilename() != null) {
            String lastFilename = lastTestCase.getInputFilename();
            try {
                String numberStr = lastFilename.substring(0, lastFilename.lastIndexOf('.'));
                int lastNumber = Integer.parseInt(numberStr);
                nextNumber = lastNumber + 1;
            } catch (Exception e) {
                // Ignore error, nextNumber remains 1 or could be handled differently
            }
        }
        
        String inFileName = nextNumber + ".in";
        String outFileName = nextNumber + ".out";
        // --------------------------------------------------------------------

        // Lưu trước để lấy ID (dù không dùng làm tên file nữa nhưng vẫn cần thiết cho entity)
        TestCase savedTestCase = testCaseRepository.save(testCase);

        // 4. Tạo thư mục và tiến hành lưu file vật lý
        try {
            Path problemDir = Paths.get(storagePathBase, "problem_" + problemId);
            if (!Files.exists(problemDir)) {
                Files.createDirectories(problemDir);
            }

            Path inputFilePath = problemDir.resolve(inFileName);
            Path outputFilePath = problemDir.resolve(outFileName);

            Files.writeString(inputFilePath, requestDTO.getInputContent());
            Files.writeString(outputFilePath, requestDTO.getOutputContent());

            // 5. Cập nhật lại đường dẫn file
            savedTestCase.setInputFilename(inFileName);
            savedTestCase.setOutputFilename(outFileName);

            savedTestCase = testCaseRepository.save(savedTestCase);

            // 6. Cập nhật trạng thái testcaseStatus của Problem thành ready
            if (problem.getTestcaseStatus() == TestCaseStatus.not_uploaded || problem.getTestcaseStatus() == null) {
                problem.setTestcaseStatus(TestCaseStatus.ready);
                problemRepository.save(problem);
            }

            return mapToResponseDTO(savedTestCase);
        } catch (IOException e) {
            throw new RuntimeException("Lỗi trong quá trình ghi file test case vật lý", e);
        }
    }

    @Override
    @Transactional
    public TestCaseResponseDTO updateTestCase(Integer problemId, Integer testCaseId, TestCaseRequestDTO requestDTO) {
        // 1. Kiểm tra Problem & Quyền (giống logic Create/Delete)
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + problemId));
        checkModifyPermission(problem);
        checkIfProblemInActiveContest(problemId);

        // 2. Tìm TestCase trong DB
        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new NoResultException("Không tìm thấy test case có id: " + testCaseId));

        if (!testCase.getProblem().getId().equals(problemId)) {
            throw new IllegalArgumentException("Test case không thuộc về Problem này");
        }

        // 3. Cập nhật thông tin DB
        testCase.setIsSample(requestDTO.getIsSample());
        testCase.setScoreWeight(requestDTO.getScoreWeight());

        testCase.setSampleInput(requestDTO.getInputContent());
        testCase.setSampleOutput(requestDTO.getOutputContent());

        testCase = testCaseRepository.save(testCase);

        // 4. Ghi đè file vật lý
        try {
            Path problemDir = Paths.get(storagePathBase, "problem_" + problemId);
            
            // Xóa file cũ nếu tồn tại trước khi ghi mới (để đảm bảo không có rác nếu đổi tên file, dù hiện tại ta giữ nguyên tên gốc)
            if (testCase.getInputFilename() != null) Files.deleteIfExists(problemDir.resolve(testCase.getInputFilename()));
            if (testCase.getOutputFilename() != null) Files.deleteIfExists(problemDir.resolve(testCase.getOutputFilename()));

            // Giữ nguyên tên file gốc của Test Case (Ví dụ: 1.in, 2.in)
            // Nếu vì lý do nào đó trong DB bị null, fallback về ID
            String inFileName = testCase.getInputFilename() != null ? testCase.getInputFilename() : testCase.getId() + ".in";
            String outFileName = testCase.getOutputFilename() != null ? testCase.getOutputFilename() : testCase.getId() + ".out";

            // Tạo thư mục nếu chưa tồn tại (trường hợp DB có Testcase nhưng xóa mât folder vật lý)
            if (!Files.exists(problemDir)) {
                Files.createDirectories(problemDir);
            }

            Files.writeString(problemDir.resolve(inFileName), requestDTO.getInputContent());
            Files.writeString(problemDir.resolve(outFileName), requestDTO.getOutputContent());

            testCase.setInputFilename(inFileName);
            testCase.setOutputFilename(outFileName);
            testCaseRepository.save(testCase);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi trong quá trình cập nhật file test case vật lý", e);
        }

        return mapToResponseDTO(testCase);
    }

    @Override
    public List<TestCaseResponseDTO> getTestCasesByProblem(Integer problemId) {
        return testCaseRepository.findByProblemId(problemId).stream()
                .map(this::mapToResponseDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteTestCase(Integer problemId, Integer testCaseId) {
        Problem problem = problemRepository.findById(problemId)
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + problemId));
        checkModifyPermission(problem);
        checkIfProblemInActiveContest(problemId);

        TestCase testCase = testCaseRepository.findById(testCaseId)
                .orElseThrow(() -> new NoResultException("Không tìm thấy test case có id: " + testCaseId));
                
        if (!testCase.getProblem().getId().equals(problemId)) {
            throw new IllegalArgumentException("Test case không thuộc về Problem này");
        }

        // Xoá file vật lý
        try {
            Path problemDir = Paths.get(storagePathBase, "problem_" + problemId);
            if (testCase.getInputFilename() != null) {
                Files.deleteIfExists(problemDir.resolve(testCase.getInputFilename()));
            }
            if (testCase.getOutputFilename() != null) {
                Files.deleteIfExists(problemDir.resolve(testCase.getOutputFilename()));
            }
        } catch (IOException e) {
            e.printStackTrace(); // Log error but allow DB deletion to proceed implicitly
        }

        testCaseRepository.delete(testCase);

        // 4. Nếu không còn testcase nào, cập nhật problem status về not_uploaded
        long count = testCaseRepository.countByProblemId(problemId);
        if (count == 0) {
            problem.setTestcaseStatus(TestCaseStatus.not_uploaded);
            problemRepository.save(problem);
        }
    }

    private void checkModifyPermission(Problem problem) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsernameAndIsDeletedFalse(currentUsername)
                .orElseThrow(() -> new NoResultException("Không tìm thấy người dùng hiện tại"));

        if (currentUser.getRole() == UserRole.admin) {
            return;
        }
        if (currentUser.getRole() == UserRole.moderator) {
            if (problem.getCreatedBy() == null || !problem.getCreatedBy().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Bạn chỉ có quyền sửa bài toán do chính bạn tạo.");
            }
        } else {
            throw new AccessDeniedException("Bạn không có quyền thực hiện thao tác này.");
        }
    }

    private void checkIfProblemInActiveContest(Integer problemId) {
        List<ContestProblem> contests = contestProblemRepository.findByIdProblemId(problemId);
        for (ContestProblem cp : contests) {
            ContestStatus realStatus = contestService.computeRealTimeStatus(cp.getContest());
            if (realStatus == ContestStatus.active) {
                throw new IllegalStateException(
                        "Bài tập đang nằm trong cuộc thi đang diễn ra. Không thể thêm/sửa/xóa testcase.");
            }
        }
    }

    @Override
    @Transactional
    public ZipUploadResponseDTO uploadTestCasesZip(Integer problemId, MultipartFile file) {
        // 1. Kiểm tra quyền & Tính hợp lệ của Problem
        Problem problem = problemRepository.findById(problemId)
                .filter(p -> !p.getIsDeleted())
                .orElseThrow(() -> new NoResultException("Không tìm thấy Problem có id: " + problemId));
        checkModifyPermission(problem);
        checkIfProblemInActiveContest(problemId);

        if (file.isEmpty() || !file.getOriginalFilename().endsWith(".zip")) {
            throw new IllegalArgumentException("Vui lòng tải lên file định dạng .zip");
        }

        // 2. Gom nhóm file .in .out bằng bộ nhớ tạm (Map)
        Map<String, String> inFiles = new HashMap<>();
        Map<String, String> outFiles = new HashMap<>();

        try (ZipInputStream zis = new ZipInputStream(file.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) continue;

                String fileName = entry.getName();
                // Bỏ qua thư mục ẩn của Mac/Windows
                if (fileName.contains("__MACOSX") || fileName.contains(".DS_Store")) continue;

                // Lấy nội dung file thành chuỗi
                String content = new BufferedReader(new InputStreamReader(zis, StandardCharsets.UTF_8))
                        .lines().collect(Collectors.joining("\n"));

                String[] parts = fileName.split("/");
                String actualFileName = parts[parts.length - 1]; // Lấy tên file gốc không chứa thư mục

                int dotIndex = actualFileName.lastIndexOf(".");
                if (dotIndex == -1) continue;

                String baseName = actualFileName.substring(0, dotIndex);
                String extension = actualFileName.substring(dotIndex);

                if (extension.equalsIgnoreCase(".in")) {
                    inFiles.put(baseName, content);
                } else if (extension.equalsIgnoreCase(".out")) {
                    outFiles.put(baseName, content);
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi đọc file ZIP", e);
        }

        // 3. Tiến hành ghép cặp và lưu vào Database + Ổ cứng
        int successCount = 0;
        int skipCount = 0;
        List<String> errors = new ArrayList<>();

        for (String baseName : inFiles.keySet()) {
            if (!outFiles.containsKey(baseName)) {
                skipCount++;
                errors.add("Bỏ qua '" + baseName + ".in' vì không tìm thấy '" + baseName + ".out'");
                continue;
            }

            String inContent = inFiles.get(baseName);
            String outContent = outFiles.get(baseName);

            try {
                // Tạo request giả lập giống hệt cách người dùng nhập từ UI
                TestCaseRequestDTO requestDTO = new TestCaseRequestDTO();
                requestDTO.setInputContent(inContent);
                requestDTO.setOutputContent(outContent);
                requestDTO.setIsSample(false); // Up zip mặc định là test case ẩn
                requestDTO.setScoreWeight(1);

                // Gọi lại hàm createTestCase đã viết ở bài trước
                createTestCase(problem.getId(), requestDTO);
                successCount++;
            } catch (Exception e) {
                skipCount++;
                errors.add("Lỗi khi lưu cặp test case '" + baseName + "': " + e.getMessage());
            }
        }

        // Đếm thêm các file .out thừa (không có .in tương ứng)
        for (String baseName : outFiles.keySet()) {
            if (!inFiles.containsKey(baseName)) {
                skipCount++;
                errors.add("Bỏ qua '" + baseName + ".out' vì không tìm thấy file .in tương ứng");
            }
        }

        return new ZipUploadResponseDTO(successCount, skipCount, errors);
    }

    private TestCaseResponseDTO mapToResponseDTO(TestCase testCase) {
        TestCaseResponseDTO dto = new TestCaseResponseDTO();
        dto.setId(testCase.getId());
        dto.setIsSample(testCase.getIsSample());
        dto.setSampleInput(testCase.getSampleInput());
        dto.setSampleOutput(testCase.getSampleOutput());
        dto.setInputFilename(testCase.getInputFilename());
        dto.setOutputFilename(testCase.getOutputFilename());
        dto.setScoreWeight(testCase.getScoreWeight());
        return dto;
    }

    @Override
    public String getExpectedOutput(Integer testCaseId) {
        return testCaseRepository.findById(testCaseId).map(tc -> {
            if (Boolean.TRUE.equals(tc.getIsSample())) {
                return tc.getSampleOutput();
            }
            // TODO: Dev 2 sẽ viết logic đọc file .out từ ổ cứng (FS) thông qua
            // tc.getOutputFilename()
            return "MOCKED_HIDDEN_OUTPUT_WAITING_FOR_DEV2";
        }).orElseThrow(() -> new RuntimeException("Test case not found"));
    }
}
