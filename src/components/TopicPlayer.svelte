<script lang="ts">
  import SubjectCard from './SubjectCard.svelte';
  import SubjectStack from './SubjectStack.svelte';
  import AudioEngine from './AudioEngine.svelte';
  import type { ResolvedSound, AudioEngineAPI } from './AudioEngine.svelte';

  interface Props {
    slug: string;
  }

  let { slug }: Props = $props();

  // ── Types ────────────────────────────────────────────────────────────────
  interface Subject {
    id: string;
    title: string;
    imageUrl: string | null;
    sortOrder: number;
  }

  interface ApiResponse {
    topic: { id: string; title: string; slug: string; backgroundUrl: string | null };
    subjects: Subject[];
  }

  // ── State ────────────────────────────────────────────────────────────────
  let subjects = $state<Subject[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let audioEngine = $state<AudioEngineAPI | null>(null);

  // Track loading state per subject: null = not loaded, true = loading, false = loaded
  let soundLoadState = $state<Record<string, 'idle' | 'loading' | 'ready' | 'error'>>({});

  // ── Fetch subjects (no sounds) ────────────────────────────────────────────
  $effect(() => {
    fetch(`/api/topics/${slug}/subjects`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiResponse>;
      })
      .then(data => {
        subjects = data.subjects ?? [];
        // Initialise all subjects as idle
        const state: Record<string, 'idle' | 'loading' | 'ready' | 'error'> = {};
        for (const s of subjects) state[s.id] = 'idle';
        soundLoadState = state;
        loading = false;
      })
      .catch(e => {
        error = e instanceof Error ? e.message : 'Failed to load';
        loading = false;
      });
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  function handleAudioReady(engine: AudioEngineAPI) {
    audioEngine = engine;
  }

  async function handleTap(subjectId: string, onDone?: () => void) {
    if (!audioEngine) return;

    const state = soundLoadState[subjectId];

    // If already loading, ignore the tap (debounce)
    if (state === 'loading') return;

    // If sounds not yet fetched, fetch + decode first
    if (state === 'idle' || state === 'error') {
      soundLoadState = { ...soundLoadState, [subjectId]: 'loading' };
      try {
        const res = await fetch(`/api/subjects/${subjectId}/sounds`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { sounds: ResolvedSound[] };
        await audioEngine.loadSubject(subjectId, data.sounds);
        soundLoadState = { ...soundLoadState, [subjectId]: 'ready' };
      } catch (err) {
        console.warn('[TopicPlayer] Failed to load sounds for', subjectId, err);
        soundLoadState = { ...soundLoadState, [subjectId]: 'error' };
        onDone?.();
        return;
      }
    }

    // Sounds are ready — play
    await audioEngine.play(subjectId, onDone);
  }
</script>

{#if loading}
  <div class="loading-state">
    <div class="loading-spinner">
      <i class="ph-bold ph-music-notes" style="font-size:48px; color:#FF4B4B;" aria-hidden="true"></i>
    </div>
  </div>

{:else if error}
  <div class="error-state">
    <p>Could not load subjects.</p>
  </div>

{:else if subjects.length === 0}
  <!-- empty -->

{:else}
  <!-- ── Mobile: card stack ─────────────────────────────────────────────── -->
  <div class="layout-stack">
    <SubjectStack
      {subjects}
      {soundLoadState}
      onTap={handleTap}
    />
  </div>

  <!-- ── Tablet+: grid ─────────────────────────────────────────────────── -->
  <div class="layout-grid">
    <div class="subject-grid">
      {#each subjects as subject (subject.id)}
        <div class="card-slot">
          <SubjectCard
            id={subject.id}
            title={subject.title}
            imageUrl={subject.imageUrl}
            soundState={soundLoadState[subject.id] ?? 'idle'}
            onTap={handleTap}
          />
        </div>
      {/each}
    </div>
  </div>

  <!-- AudioEngine: headless, plays decoded sounds -->
  <AudioEngine onReady={handleAudioReady} />
{/if}

<style>
  .loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .loading-spinner {
    animation: spin-bounce 1.2s ease-in-out infinite;
  }

  @keyframes spin-bounce {
    0%, 100% { transform: scale(0.8) rotate(0deg);   opacity: 0.6; }
    50%       { transform: scale(1.1) rotate(180deg); opacity: 1.0; }
  }

  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #94a3b8;
    font-family: 'Nunito', sans-serif;
    font-size: 16px;
  }

  .layout-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .layout-grid {
    display: none;
    width: 100%;
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 24px;
    box-sizing: border-box;
  }

  @media (min-width: 600px) {
    .layout-stack { display: none; }
    .layout-grid  { display: block; }
  }

  .subject-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
    width: 100%;
    align-content: start;
  }

  @media (min-width: 600px) {
    .subject-grid { grid-template-columns: repeat(3, 1fr); gap: 28px; }
  }

  @media (min-width: 900px) {
    .subject-grid { grid-template-columns: repeat(4, 1fr); gap: 32px; }
  }

  @media (min-width: 1200px) {
    .subject-grid { grid-template-columns: repeat(5, 1fr); gap: 32px; }
  }

  .card-slot {
    width: 100%;
  }
</style>
