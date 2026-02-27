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

        DefaultDockerClientConfig config =
                DefaultDockerClientConfig.createDefaultConfigBuilder()
                        .withDockerHost(
                                System.getenv().getOrDefault(
                                        "DOCKER_HOST",
                                        "tcp://127.0.0.1:2375"
                                )
                        )
                        .build();

        ApacheDockerHttpClient httpClient =
                new ApacheDockerHttpClient.Builder()
                        .dockerHost(config.getDockerHost())
                        .sslConfig(config.getSSLConfig())
                        .maxConnections(100)
                        .connectionTimeout(Duration.ofSeconds(5))
                        .responseTimeout(Duration.ofSeconds(30))
                        .build();

        return DockerClientBuilder.getInstance(config)
                .withDockerHttpClient(httpClient)
                .build();
    }
}