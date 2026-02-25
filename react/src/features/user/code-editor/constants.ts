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