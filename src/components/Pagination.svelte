<script lang="ts">
  interface Props {
    page: number;
    pageSize: number;
    total: number;
    onchange?: (page: number) => void;
  }

  let { page, pageSize, total, onchange }: Props = $props();

  let totalPages = $derived(Math.max(1, Math.ceil(total / pageSize)));
  let hasPrev = $derived(page > 1);
  let hasNext = $derived(page < totalPages);

  // Show at most 5 page dots
  let visiblePages = $derived(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const half = 2;
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, page + half);
    if (start === 1) end = Math.min(totalPages, 5);
    if (end === totalPages) start = Math.max(1, totalPages - 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  function go(p: number) {
    if (p < 1 || p > totalPages || p === page) return;
    onchange?.(p);
  }
</script>

{#if totalPages > 1}
  <nav class="pagination" aria-label="Pagination">
    <!-- Prev button — ≥100px tap target -->
    <button
      class="nav-btn"
      onclick={() => go(page - 1)}
      disabled={!hasPrev}
      aria-label="Previous page"
    >
      ‹
    </button>

    <!-- Page dots -->
    <div class="dots" role="group" aria-label="Pages">
      {#if visiblePages()[0] > 1}
        <button class="dot" onclick={() => go(1)} aria-label="Page 1">1</button>
        {#if visiblePages()[0] > 2}
          <span class="ellipsis" aria-hidden="true">…</span>
        {/if}
      {/if}

      {#each visiblePages() as p (p)}
        <button
          class="dot"
          class:current={p === page}
          onclick={() => go(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      {/each}

      {#if visiblePages()[visiblePages().length - 1] < totalPages}
        {#if visiblePages()[visiblePages().length - 1] < totalPages - 1}
          <span class="ellipsis" aria-hidden="true">…</span>
        {/if}
        <button class="dot" onclick={() => go(totalPages)} aria-label={`Page ${totalPages}`}>
          {totalPages}
        </button>
      {/if}
    </div>

    <!-- Next button — ≥100px tap target -->
    <button
      class="nav-btn"
      onclick={() => go(page + 1)}
      disabled={!hasNext}
      aria-label="Next page"
    >
      ›
    </button>
  </nav>
{/if}

<style>
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px 0;
    user-select: none;
  }

  /* ── Prev / Next buttons — ≥100px wide per design system ──────────────── */
  .nav-btn {
    min-width: 100px;
    min-height: 56px;
    padding: 8px 16px;

    background: white;
    border: 2.5px solid #e2e8f0;
    border-radius: 16px;
    color: #1e293b;

    font-family: 'Nunito', sans-serif;
    font-size: 28px;
    font-weight: 800;
    line-height: 1;

    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;

    transition:
      background 100ms ease-out,
      border-color 100ms ease-out,
      transform 80ms ease-out,
      opacity 100ms ease-out;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .nav-btn:hover:not(:disabled) {
    background: #eff8ff;
    border-color: #4BA3FF;
    color: #0369a1;
    transform: scale(1.04);
  }

  .nav-btn:active:not(:disabled) {
    transform: scale(0.96);
  }

  .nav-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .nav-btn:focus-visible {
    outline: 3px solid #4BA3FF;
    outline-offset: 2px;
  }

  /* ── Dots group ────────────────────────────────────────────────────────── */
  .dots {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* ── Individual page dot ───────────────────────────────────────────────── */
  .dot {
    min-width: 44px;
    min-height: 44px;
    padding: 4px;
    border-radius: 12px;

    background: transparent;
    border: 2px solid transparent;
    color: #475569;

    font-family: 'Nunito', sans-serif;
    font-size: 16px;
    font-weight: 800;

    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    outline: none;

    transition:
      background 100ms ease-out,
      border-color 100ms ease-out,
      color 100ms ease-out,
      transform 80ms ease-out;
  }

  .dot:hover:not(.current) {
    background: #f1f5f9;
    border-color: #cbd5e1;
    color: #1e293b;
  }

  .dot:active {
    transform: scale(0.92);
  }

  .dot.current {
    background: #4BA3FF;
    border-color: #4BA3FF;
    color: white;
    box-shadow: 0 2px 8px rgba(75, 163, 255, 0.35);
    cursor: default;
  }

  .dot:focus-visible {
    outline: 3px solid #4BA3FF;
    outline-offset: 2px;
  }

  /* ── Ellipsis ──────────────────────────────────────────────────────────── */
  .ellipsis {
    color: #94a3b8;
    font-size: 16px;
    font-weight: 700;
    padding: 0 2px;
    line-height: 44px;
  }
</style>