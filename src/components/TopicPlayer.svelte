<script lang="ts">
  import SubjectCard from './SubjectCard.svelte';
  import SubjectStack from './SubjectStack.svelte';
  import AudioEngine from './AudioEngine.svelte';
  import type { ResolvedSound, AudioEngineAPI } from './AudioEngine.svelte';
  import MusicNotesIcon from 'phosphor-svelte/lib/MusicNotesIcon.svelte';

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
    sounds: ResolvedSound[];
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

  // Derived: the subjects prop AudioEngine needs
  let audioSubjects = $derived(subjects.map(s => ({
    subjectId: s.id,
    sounds: s.sounds,
  })));

  let hasSounds = $derived(audioSubjects.some(s => s.sounds.length > 0));

  // ── Fetch subjects at runtime ─────────────────────────────────────────────
  $effect(() => {
    fetch(`/api/topics/${slug}/subjects`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ApiResponse>;
      })
      .then(data => {
        subjects = data.subjects ?? [];
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

  function handleTap(subjectId: string, onDone?: () => void) {
    audioEngine?.play(subjectId, onDone);
  }
</script>

{#if loading}
  <!-- Loading state — match the loading overlay style from the static page -->
  <div class="loading-state">
    <div class="loading-spinner">
      <MusicNotesIcon weight="bold" size={48} color="#FF4B4B" />
    </div>
  </div>

{:else if error}
  <div class="error-state">
    <p>Could not load subjects.</p>
  </div>

{:else if subjects.length === 0}
  <!-- Empty state handled by parent page -->

{:else}
  <!-- ── Mobile: card stack ─────────────────────────────────────────────── -->
  <div class="layout-stack">
    <SubjectStack
      {subjects}
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
            sounds={subject.sounds}
            onTap={handleTap}
          />
        </div>
      {/each}
    </div>
  </div>

  <!-- AudioEngine: headless, preloads + plays sounds -->
  {#if hasSounds}
    <AudioEngine
      subjects={audioSubjects}
      onReady={handleAudioReady}
    />
  {/if}
{/if}

<style>
  /* ── Loading ─────────────────────────────────────────────────────────── */
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

  /* ── Layout switching (mobile stack vs tablet grid) ──────────────────── */
  .layout-stack {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }

  .layout-grid {
    display: none;
    width: 100%;
    height: 100%;
  }

  @media (min-width: 600px) {
    .layout-stack { display: none; }
    .layout-grid  { display: block; }
  }

  /* ── Subject grid ────────────────────────────────────────────────────── */
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
