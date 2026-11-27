package co.edu.unicauca.backend.collections.infrastructure.adapter.in.web.dto.req;

/** Shape bounds shared by the collection requests; business invariants stay in the domain. */
final class RequestLimits {
    static final int MAX_TEXT = 100_000;
    static final int MAX_COLUMNS = 500;
    static final int MAX_ROWS = 50_000;
    static final String CONTEXTS = "collection|permit|sampling|marine|other";

    private RequestLimits() {}
}
