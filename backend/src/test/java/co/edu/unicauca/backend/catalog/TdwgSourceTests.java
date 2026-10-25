package co.edu.unicauca.backend.catalog;

import co.edu.unicauca.backend.catalog.infrastructure.adapter.out.tdwg.TdwgSource;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.SocketTimeoutException;
import java.nio.charset.StandardCharsets;
import static org.assertj.core.api.Assertions.*;

class TdwgSourceTests {
    static class Connection extends HttpURLConnection {
        int status = 200;
        long length = -1;
        byte[] body = "Exact, \"quoted\"\ncontent".getBytes(StandardCharsets.UTF_8);
        boolean disconnected;
        Connection() throws Exception { super(URI.create("https://raw.githubusercontent.com/tdwg/rs.tdwg.org/test").toURL()); }
        @Override public int getResponseCode() { return status; }
        @Override public long getContentLengthLong() { return length; }
        @Override public InputStream getInputStream() throws IOException { return new ByteArrayInputStream(body); }
        @Override public void disconnect() { disconnected = true; }
        @Override public void connect() {}
        @Override public boolean usingProxy() { return false; }
    }
    @Test void successfulTransportIsBoundedAndPreservesExactUtf8() throws Exception {
        Connection connection = new Connection();
        assertThat(TdwgSource.read(connection, 100)).isEqualTo(new String(connection.body, StandardCharsets.UTF_8));
        assertThat(connection.getConnectTimeout()).isEqualTo(5000);
        assertThat(connection.getReadTimeout()).isEqualTo(10000);
        assertThat(connection.getInstanceFollowRedirects()).isFalse();
        assertThat(connection.disconnected).isTrue();
    }
    @ParameterizedTest
    @ValueSource(strings = {"http", "redirect", "declaredOversize", "streamOversize", "truncated", "utf8", "timeout"})
    void rejectsFailedHttpAndIncompleteOrOversizedPayload(String kind) throws Exception {
        Connection connection = kind.equals("timeout") ? new Connection() {
            @Override public InputStream getInputStream() throws SocketTimeoutException {
                throw new SocketTimeoutException("Tiempo agotado simulado");
            }
        } : new Connection();
        switch (kind) {
            case "http" -> connection.status = 503;
            case "redirect" -> connection.status = 302;
            case "declaredOversize" -> connection.length = 101;
            case "streamOversize" -> connection.body = new byte[101];
            case "truncated" -> connection.length = 99;
            case "utf8" -> connection.body = new byte[]{(byte) 0xff};
        }
        assertThatThrownBy(() -> TdwgSource.read(connection, 100)).isInstanceOf(IOException.class);
        assertThat(connection.disconnected).isTrue();
    }
}
