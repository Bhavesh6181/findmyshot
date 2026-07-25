package com.findmyshot;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

@Configuration
public class ExecutorConfig {

    /**
     * I/O-bound pool: Cloudinary uploads, MongoDB writes.
     * Threads spend most of their time blocked on the network, so a larger
     * pool is fine — they don't consume CPU while waiting.
     */
    @Bean(name = "ioExecutor", destroyMethod = "shutdown")
    public ExecutorService ioExecutor() {
        return new ThreadPoolExecutor(
                4, 16,
                60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(200),
                new ThreadPoolExecutor.CallerRunsPolicy()  // slow down caller rather than reject
        );
    }

    /**
     * CPU-bound pool: ONNX face detection + recognition inference.
     * Concurrency must match the actual vCPU budget, not thread count.
     * On a 0.1–0.5 vCPU container, that means exactly 1 concurrent inference.
     *
     * The queue is bounded (20 slots). When full, AbortPolicy fires a
     * RejectedExecutionException — the controller catches this and returns
     * HTTP 429 with a Retry-After header so the frontend backs off instead
     * of flooding a saturated server.
     */
    @Bean(name = "cpuExecutor", destroyMethod = "shutdown")
    public ExecutorService cpuExecutor() {
        return new ThreadPoolExecutor(
                1, 1,
                0L, TimeUnit.MILLISECONDS,
                new ArrayBlockingQueue<>(20),
                new ThreadPoolExecutor.AbortPolicy()  // reject, return 429, don't OOM
        );
    }
}
