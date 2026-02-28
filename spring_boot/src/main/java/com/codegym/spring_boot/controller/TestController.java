package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.SubmissionResult;
import com.codegym.spring_boot.service.DockerJudgeService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class TestController {

    private final DockerJudgeService dockerJudgeService;

    public TestController(DockerJudgeService dockerJudgeService) {
        this.dockerJudgeService = dockerJudgeService;
    }

    @GetMapping("/test-cpp")
    public SubmissionResult testCpp() {
        return dockerJudgeService.judge(
                "cpp",
                "#include <iostream>\n" +
                        "using namespace std;\n" +
                        "int main() {\n" +
                        "    int a, b;\n" +
                        "    if (cin >> a >> b) cout << a + b << endl;\n" +
                        "    return 0;\n" +
                        "}",
                "sum-two-numbers",
                false);
    }

    @GetMapping("/test-python")
    public SubmissionResult testPython() {
        return dockerJudgeService.judge(
                "python",
                "import sys\n" +
                        "for line in sys.stdin:\n" +
                        "    a, b = map(int, line.split())\n" +
                        "    print(a + b)",
                "sum-two-numbers",
                false);
    }
}
