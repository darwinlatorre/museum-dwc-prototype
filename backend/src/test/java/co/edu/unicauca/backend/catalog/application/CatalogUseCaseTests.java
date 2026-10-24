package co.edu.unicauca.backend.catalog.application;

import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations;
import co.edu.unicauca.backend.catalog.application.port.in.CatalogOperations.Outcome;
import co.edu.unicauca.backend.catalog.application.port.out.CatalogStore;
import co.edu.unicauca.backend.catalog.application.usecase.CatalogUseCase;
import co.edu.unicauca.backend.catalog.domain.CatalogCandidate;
import co.edu.unicauca.backend.catalog.domain.CatalogPolicy;
import co.edu.unicauca.backend.catalog.domain.CatalogStatus;
import co.edu.unicauca.backend.catalog.domain.Term;
import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.*;

class CatalogUseCaseTests {
    private static final CatalogCandidate CANDIDATE = new CatalogCandidate("revision", List.of(
        new Term("name", "https://example.test/name", " Exact\ntext ", "", "current")),
        "exact payload", "hash", "raw", Map.of("source", "hash"));

    @Test
    void downloadFollowsCommittedBeginAndPrecedesAtomicActivation() {
        FakeStore store = new FakeStore();
        CatalogOperations useCase = new CatalogUseCase(() -> {
            assertEquals(List.of("begin"), store.events);
            store.events.add("fetch");
            return CANDIDATE;
        }, store);

        var result = useCase.synchronize();

        assertEquals(List.of("begin", "fetch", "activate:1", "status"), store.events);
        assertEquals(Outcome.SUCCESS, result.outcome());
        assertEquals(CANDIDATE.payload(), useCase.payload());
        assertEquals(1, result.status().attempts());
        assertEquals("revision", result.status().active().revision());
        assertNull(result.status().lastFailure());
    }

    @Test
    void schedulerAttemptDoesNotReadStatusAndRecoveryClearsLastFailure() {
        FakeStore store = new FakeStore();
        AtomicInteger calls = new AtomicInteger();
        var useCase = new CatalogUseCase(() -> {
            if (calls.getAndIncrement() == 0) throw new IOException("offline");
            return CANDIDATE;
        }, store);

        assertFalse(useCase.attempt().success());
        assertEquals(List.of("begin", "fail:1"), store.events);
        assertEquals("bundled bytes", useCase.payload());
        assertEquals(CatalogPolicy.SYNC_FAILURE, store.failure);
        assertTrue(useCase.attempt().success());
        assertEquals(2, store.generation);
        assertNull(store.failure);
        assertEquals(CANDIDATE.payload(), useCase.payload());
    }

    @ParameterizedTest
    @ValueSource(strings = {"io", "runtime", "activation"})
    void failedAttemptPreservesSnapshotAndRegistersFailure(String failure) {
        FakeStore store = new FakeStore();
        store.rejectActivation = failure.equals("activation");
        var before = store.active;
        var useCase = new CatalogUseCase(() -> {
            if (failure.equals("io")) throw new IOException("download");
            if (failure.equals("runtime")) throw new IllegalArgumentException("parse");
            return CANDIDATE;
        }, store);

        var result = useCase.synchronize();

        assertEquals(Outcome.FAILED, result.outcome());
        assertTrue(result.attempt().failureRecorded());
        assertEquals(before, result.status().active());
        assertEquals("bundled bytes", useCase.payload());
        assertEquals(1, result.status().attempts());
        assertEquals(CatalogPolicy.SYNC_FAILURE, result.status().lastFailure());
        assertTrue(store.events.contains("fail:1"));
    }

    @Test
    void beginFailureDoesNotFetchOrTryToRecordAnUnallocatedGeneration() {
        FakeStore store = new FakeStore();
        store.rejectBegin = true;
        var useCase = new CatalogUseCase(() -> { fail("must not fetch"); return CANDIDATE; }, store);
        var result = useCase.synchronize();
        assertEquals(Outcome.FAILED, result.outcome());
        assertNull(result.attempt().generation());
        assertEquals(List.of("begin", "status"), store.events);
        assertEquals(0, result.status().attempts());
        assertNull(result.status().lastFailure());
        assertEquals("bundled bytes", useCase.payload());
    }

    @Test
    void failureRegistrationFailureStillReturnsFailedAndPreservesSnapshot() {
        FakeStore store = new FakeStore();
        store.rejectFail = true;
        var useCase = new CatalogUseCase(() -> { throw new IOException("offline"); }, store);
        var result = useCase.synchronize();
        assertEquals(Outcome.FAILED, result.outcome());
        assertFalse(result.attempt().failureRecorded());
        assertEquals(List.of("begin", "fail:1", "status"), store.events);
        assertEquals("bundled bytes", useCase.payload());
        assertNull(result.status().lastFailure());
    }

    @Test
    void statusReadFailureIsNotMisrepresentedAsAConfirmedResult() {
        FakeStore store = new FakeStore();
        store.rejectStatus = true;
        var useCase = new CatalogUseCase(() -> CANDIDATE, store);
        assertThrows(IllegalStateException.class, useCase::synchronize);
        assertEquals(List.of("begin", "activate:1", "status"), store.events);
        assertEquals(CANDIDATE.payload(), useCase.payload());
        assertNull(store.failure);
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3, 4, 5, 6, 7})
    void allManualScheduledAndSuccessFailureInterleavingsKeepLatest(int mode) {
        boolean manualOlder = (mode & 4) == 0;
        boolean oldFails = (mode & 2) != 0;
        boolean newFails = (mode & 1) != 0;
        FakeStore store = new FakeStore();
        var initial = store.active;
        AtomicInteger downloads = new AtomicInteger();
        AtomicReference<CatalogUseCase> reference = new AtomicReference<>();
        AtomicReference<CatalogStatus> latest = new AtomicReference<>();
        var useCase = new CatalogUseCase(() -> {
            if (downloads.incrementAndGet() == 1) {
                if (manualOlder) reference.get().attempt();
                else assertEquals(newFails ? Outcome.FAILED : Outcome.SUCCESS,
                    reference.get().synchronize().outcome());
                latest.set(store.status());
                if (oldFails) throw new IOException("old failure");
            } else if (newFails) throw new IOException("new failure");
            return CANDIDATE;
        }, store);
        reference.set(useCase);

        if (manualOlder) {
            var result = useCase.synchronize();
            assertEquals(Outcome.SUPERSEDED, result.outcome());
            assertEquals(latest.get(), result.status());
        } else useCase.attempt();

        assertEquals(latest.get(), store.status());
        assertEquals(2, store.generation);
        assertEquals(newFails ? initial : activeCandidate(), store.active);
        assertEquals(newFails ? CatalogPolicy.SYNC_FAILURE : null, store.failure);
        assertEquals(newFails ? "bundled bytes" : CANDIDATE.payload(), useCase.payload());
        assertEquals(2, downloads.get());
    }

    private static CatalogStatus.Active activeCandidate() {
        return new CatalogStatus.Active(CANDIDATE.revision(), CANDIDATE.hash(), 1, Instant.EPOCH,
            CANDIDATE.terms().size(), 0, 0, 0, CANDIDATE.hashes());
    }

    /** Fake de capacidad atómica; no reemplaza las carreras probadas con PostgreSQL. */
    private static class FakeStore implements CatalogStore {
        final List<String> events = new ArrayList<>();
        long generation;
        String payload = "bundled bytes";
        String failure;
        CatalogStatus.Active active = new CatalogStatus.Active("bundled", "bundle hash", 0, Instant.EPOCH,
            1, 0, 0, 0, Map.of());
        boolean rejectBegin;
        boolean rejectActivation;
        boolean rejectFail;
        boolean rejectStatus;

        @Override public void initialize() {}
        @Override public String payload() { return payload; }
        @Override public CatalogStatus status() {
            events.add("status");
            if (rejectStatus) throw new IllegalStateException("status unavailable");
            return new CatalogStatus(active, generation, generation == 0 ? null : Instant.EPOCH, failure);
        }
        @Override public long beginAttempt() {
            events.add("begin");
            if (rejectBegin) throw new IllegalStateException("begin unavailable");
            return ++generation;
        }
        @Override public void activate(long attempt, CatalogCandidate candidate) {
            events.add("activate:" + attempt);
            if (generation != attempt) return;
            if (rejectActivation) throw new IllegalArgumentException("candidate rejected");
            payload = candidate.payload();
            active = activeCandidate();
            failure = null;
        }
        @Override public void fail(long attempt) {
            events.add("fail:" + attempt);
            if (rejectFail) throw new IllegalStateException("failure unavailable");
            if (generation == attempt) failure = CatalogPolicy.SYNC_FAILURE;
        }
    }
}
