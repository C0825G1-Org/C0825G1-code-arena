package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.dto.SubmissionRequest;
import com.codegym.spring_boot.dto.SubmissionResult;
import com.codegym.spring_boot.service.SubmissionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class Dev3TestController {

    private final SubmissionService submissionService;

    public Dev3TestController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    @GetMapping("/test-cpp")
    public SubmissionResult testCpp() {
        SubmissionRequest request = new SubmissionRequest();
        request.setLanguage("cpp");
        request.setProblemId("sum-two-numbers");
        request.setSourceCode(
            "#include <iostream>\n" +
            "using namespace std;\n" +
            "int main() {\n" +
            "    int a, b;\n" +
            "    if (cin >> a >> b) cout << a + b << endl;\n" +
            "    return 0;\n" +
            "}"
        );
        return submissionService.handleSubmission(request);
    }

    @GetMapping("/test-python")
    public SubmissionResult testPython() {
        SubmissionRequest request = new SubmissionRequest();
        request.setLanguage("python");
        request.setProblemId("sum-two-numbers");
        request.setSourceCode(
            "import sys\n" +
            "for line in sys.stdin:\n" +
            "    a, b = map(int, line.split())\n" +
            "    print(a + b)"
        );
        return submissionService.handleSubmission(request);
    }
}
