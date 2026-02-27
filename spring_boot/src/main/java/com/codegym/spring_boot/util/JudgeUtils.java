package com.codegym.spring_boot.util;

import com.codegym.spring_boot.dto.TestCaseResult;
import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Frame;
import java.io.Closeable;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class JudgeUtils {

    public static String getSourceFileName(String language) {
        return switch (language.toLowerCase()) {
            case "java" -> "Main.java";
            case "cpp", "c++" -> "Main.cpp";
            case "python" -> "solution.py";
            case "js", "javascript" -> "solution.js";
            default -> "solution.txt";
        };
    }

    /**
     * Phân tích logs từ Docker để trích xuất kết quả từng testcase
     */
    public static List<TestCaseResult> parseTestResults(String logs, String problemPath) {
        List<TestCaseResult> results = new ArrayList<>();

        // Regex để tách từng khối TESTCASE
        String regex = "--- TESTCASE (\\d+) ---\\n(.*?)(?=\\n--- TESTCASE|\\n--- ALL_DONE ---|$)";
        Pattern pattern = Pattern.compile(regex, Pattern.DOTALL);
        Matcher matcher = pattern.matcher(logs);

        while (matcher.find()) {
            int testId = Integer.parseInt(matcher.group(1));
            String content = matcher.group(2);

            boolean passed = false;
            String status = "UNKNOWN";

            if (content.contains("STATUS: SUCCESS")) {
                status = "SUCCESS";
                // Tách output thực tế
                String outputRegex = "ACTUAL_OUTPUT_START\\n(.*?)\\nACTUAL_OUTPUT_END";
                Matcher outputMatcher = Pattern.compile(outputRegex, Pattern.DOTALL).matcher(content);

                if (outputMatcher.find()) {
                    String actualOutput = outputMatcher.group(1).trim();
                    passed = compareWithExpected(actualOutput, problemPath, testId);
                    if (!passed)
                        status = "WA";
                }
            } else if (content.contains("STATUS: TLE")) {
                status = "TLE";
            } else if (content.contains("STATUS: RE")) {
                status = "RE";
            }

            results.add(new TestCaseResult(testId, passed, status));
        }

        return results;
    }

    private static boolean compareWithExpected(String actual, String problemPath, int testId) {
        try {
            Path expectedPath = Path.of(problemPath, testId + ".out");
            if (!Files.exists(expectedPath))
                return false;

            String expected = Files.readString(expectedPath).trim();
            // So sánh bỏ qua khoảng trắng thừa ở cuối dòng/cuối file
            return expected.equals(actual);
        } catch (Exception e) {
            return false;
        }
    }

    public static class LogContainerResultCallback extends ResultCallback.Adapter<Frame> {
        protected final StringBuilder sb = new StringBuilder();

        @Override
        public void onNext(Frame frame) {
            if (frame != null) {
                sb.append(new String(frame.getPayload()));
            }
        }

        @Override
        public String toString() {
            return sb.toString();
        }
    }
}
