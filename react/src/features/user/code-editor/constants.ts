export const boilerplateMap: Record<string, string> = {
    javascript: `// Sử dụng fs.readFileSync(0) để đọc toàn bộ stdin
const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf8');
    const lines = input.split('\\n');
    // Viết logic tại đây
}

solve();`,

    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Viết code đọc dữ liệu (sc.nextInt()...) và xử lý tại đây
    }
}`,

    python: `import sys

def solve():
    # Đọc dữ liệu từ sys.stdin
    # input_data = sys.stdin.read().split()
    pass

if __name__ == "__main__":
    solve()`,

    cpp: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // Tối ưu tốc độ nhập xuất
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Viết code tại đây
    
    return 0;
}`
};

export const LANGUAGE_NAME_TO_ID: Record<string, number> = {
    'cpp': 1,
    'java': 2,
    'python': 3,
    'javascript': 4
};

export const BACKEND_LANGUAGE_TO_EDITOR: Record<string, string> = {
    'JavaScript': 'javascript', 'Java': 'java',
    'Python': 'python', 'C++': 'cpp',
    'javascript': 'javascript', 'java': 'java',
    'python': 'python', 'cpp': 'cpp', 'c++': 'cpp'
};

export function normalizeEditorLanguage(raw: string): string {
    if (!raw) return "unknown";
    const lower = raw.toLowerCase();
    if (lower.includes("cpp") || lower.includes("c++")) return "cpp";
    if (lower.includes("javascript") || lower.includes("node") || lower.includes("js")) return "javascript";
    if (lower.includes("java")) return "java";
    if (lower.includes("python")) return "python";
    return lower.split(" ")[0];
}