package com.codegym.spring_boot.config;

import com.github.dockerjava.api.DockerClient;
import com.github.dockerjava.core.DockerClientBuilder;
import com.github.dockerjava.core.DefaultDockerClientConfig;
import com.github.dockerjava.httpclient5.ApacheDockerHttpClient;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class DockerConfig {

        @Bean
        public DockerClient dockerClient() {

                /*
                 * Cấu hình Docker:
                 * - Nếu dùng Docker Desktop local → không cần set DOCKER_HOST
                 * - Nếu remote → set DOCKER_HOST=tcp://host:2375
                 */

                String os = System.getProperty("os.name").toLowerCase();
                String defaultHost = os.contains("win")
                                ? "tcp://localhost:2375" // Ưu tiên TCP trên Windows để ổn định hơn
                                : "unix:///var/run/docker.sock";

                String dockerHost = System.getenv("DOCKER_HOST");
                if (dockerHost == null || dockerHost.isEmpty()) {
                        dockerHost = defaultHost;
                }

                DefaultDockerClientConfig config = DefaultDockerClientConfig.createDefaultConfigBuilder()
                                .withDockerHost(dockerHost)
                                .build();

                ApacheDockerHttpClient httpClient = new ApacheDockerHttpClient.Builder()
                                .dockerHost(config.getDockerHost())
                                .sslConfig(config.getSSLConfig())
                                .maxConnections(100)
                                .connectionTimeout(Duration.ofSeconds(10)) // Tăng timeout
                                .responseTimeout(Duration.ofSeconds(45))
                                .build();

                return DockerClientBuilder.getInstance(config)
                                .withDockerHttpClient(httpClient)
                                .build();
        }
}