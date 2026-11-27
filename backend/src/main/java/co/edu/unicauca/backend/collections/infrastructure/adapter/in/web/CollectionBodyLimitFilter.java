package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web;

import java.io.ByteArrayInputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

/** Bound raw JSON before Jackson allocates a tree. No body, filename or value is logged. */
@RequiredArgsConstructor
public final class CollectionBodyLimitFilter extends OncePerRequestFilter {
    public static final int MAX_BYTES = 32 * 1024 * 1024;
    private final ObjectMapper json;

    @Override protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return !(path.equals("/api/collections") || path.startsWith("/api/collections/"))
            || !(request.getMethod().equals("POST") || request.getMethod().equals("PUT"));
    }
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (request.getContentLengthLong() > MAX_BYTES) { reject(request, response); return; }
        byte[] body = request.getInputStream().readNBytes(MAX_BYTES + 1);
        if (body.length > MAX_BYTES) { reject(request, response); return; }
        var input = new ByteArrayInputStream(body);
        var stream = new ServletInputStream() {
            @Override public int read() { return input.read(); }
            @Override public int read(byte[] bytes, int offset, int length) { return input.read(bytes, offset, length); }
            @Override public boolean isFinished() { return input.available() == 0; }
            @Override public boolean isReady() { return true; }
            @Override public void setReadListener(ReadListener listener) {
                try {
                    if (!isFinished()) listener.onDataAvailable();
                    if (isFinished()) listener.onAllDataRead();
                } catch (IOException exception) { listener.onError(exception); }
            }
        };
        chain.doFilter(new HttpServletRequestWrapper(request) {
            @Override public ServletInputStream getInputStream() { return stream; }
            @Override public BufferedReader getReader() {
                return new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8));
            }
            @Override public int getContentLength() { return body.length; }
            @Override public long getContentLengthLong() { return body.length; }
        }, response);
    }
    private void reject(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setStatus(413);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json.writeValueAsString(Map.of("status", 413, "title", "Solicitud demasiado grande",
            "detail", "La solicitud supera el tamaño permitido.", "instance", request.getRequestURI(),
            "code", "PAYLOAD_TOO_LARGE", "issues", List.of())));
    }
}
