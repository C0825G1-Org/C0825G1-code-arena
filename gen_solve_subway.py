import heapq
import os
import random

def solve(N, M, K, edges):
    adj = [[] for _ in range(N + 1)]
    for u, v, w in edges:
        adj[u].append((v, w))
        adj[v].append((u, w))
    
    # dist[k][u] is the min time to reach node u using k speed-ups
    dist = [[float('inf')] * (N + 1) for _ in range(K + 1)]
    dist[0][1] = 0
    pq = [(0, 0, 1)] # (time, k_used, u)
    
    while pq:
        d, k, u = heapq.heappop(pq)
        
        if d > dist[k][u]:
            continue
        
        for v, w in adj[u]:
            # Normal move
            if dist[k][v] > d + w:
                dist[k][v] = d + w
                heapq.heappush(pq, (dist[k][v], k, v))
            
            # Speed-up move
            if k < K:
                if dist[k+1][v] > d:
                    dist[k+1][v] = d
                    heapq.heappush(pq, (dist[k+1][v], k + 1, v))
                    
    ans = min(dist[k][N] for k in range(K + 1))
    return int(ans)

def generate_test_case(N, M, K, edges):
    input_content = f"{N} {M} {K}\n"
    for u, v, w in edges:
        input_content += f"{u} {v} {w}\n"
    
    output_content = str(solve(N, M, K, edges))
    
    return input_content, output_content

def main():
    base_path = r"E:\CODEGYM\bai_tap_code_gym\project_module_6\C0825G1-code-arena\data\problems\problem_8"
    if not os.path.exists(base_path):
        os.makedirs(base_path)

    test_cases = []

    # Test case 1: Sample from prompt
    tc1_edges = [
        (1, 2, 5), (2, 5, 5), (1, 3, 100), (3, 4, 100), (4, 5, 1), (2, 3, 50)
    ]
    test_cases.append(generate_test_case(5, 6, 2, tc1_edges))

    # Test case 2: Another sample (simpler)
    tc2_edges = [
        (1, 2, 10), (2, 3, 10), (1, 3, 15)
    ]
    test_cases.append(generate_test_case(3, 3, 1, tc2_edges))

    # Test case 3: K=0 case
    tc3_n, tc3_m, tc3_k = 10, 15, 0
    tc3_edges = []
    for i in range(1, tc3_n):
        tc3_edges.append((i, i+1, random.randint(1, 100)))
    for _ in range(tc3_m - (tc3_n - 1)):
        tc3_edges.append((random.randint(1, tc3_n), random.randint(1, tc3_n), random.randint(1, 100)))
    test_cases.append(generate_test_case(tc3_n, tc3_m, tc3_k, tc3_edges))

    # Test case 4-10: Random tests with increasing sizes
    # Limited for speed in generator
    configs = [
        (100, 200, 2),
        (500, 1000, 3),
        (1000, 2000, 5),
        (5000, 10000, 8),
        (10000, 20000, 10),
        (20000, 40000, 5),
        (50000, 100000, 10)
    ]

    for n, m, k in configs:
        edges = []
        # Ensure path exists
        for j in range(1, n):
            edges.append((j, j+1, random.randint(1, 10**9)))
        # Add random edges
        for _ in range(m - (n-1)):
            u, v = random.sample(range(1, n + 1), 2)
            w = random.randint(1, 10**9)
            edges.append((u, v, w))
        test_cases.append(generate_test_case(n, m, k, edges))

    for i, (inp, out) in enumerate(test_cases, 1):
        with open(os.path.join(base_path, f"{i}.in"), "w", encoding='utf-8') as f:
            f.write(inp)
        with open(os.path.join(base_path, f"{i}.out"), "w", encoding='utf-8') as f:
            f.write(out)
        print(f"Generated test case {i}")

if __name__ == "__main__":
    main()
