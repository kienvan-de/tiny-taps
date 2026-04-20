<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export interface ResolvedSound {
    id: string;
    sortOrder: number;
    delayBeforeMs: number;
    url: string;
  }

  export interface SubjectAudio {
    subjectId: string;
    sounds: ResolvedSound[];
  }

  interface Props {
    subjects: SubjectAudio[];
    onReady?: () => void;
    onError?: (err: string) => void;
  }

  let { subjects = [], onReady, onError }: Props = $props();

  // AudioContext — created on first user interaction (browser autoplay policy)
  let audioCtx: AudioContext | null = null;

  // Pre-decoded buffers: subjectId → ResolvedSound[] with decoded AudioBuffer
  type DecodedSound = ResolvedSound & { buffer: AudioBuffer | null };
  let decodedMap = new Map<string, DecodedSound[]>();

  // Playback state
  let currentSubjectId: string | null = null;
  let currentSources: AudioBufferSourceNode[] = [];
  let currentTimeouts: ReturnType<typeof setTimeout>[] = [];
  let isReady = $state(false);
  let loadProgress = $state(0);
  let loadTotal = $state(0);

  // ── AudioContext ────────────────────────────────────────────────────────

  function getOrCreateContext(): AudioContext {
    if (!audioCtx || audioCtx.state === 'closed') {
      audioCtx = new AudioContext();
    }
    return audioCtx;
  }

  // ── Preloading ──────────────────────────────────────────────────────────

  async function preloadAll() {
    if (!subjects.length) {
      isReady = true;
      onReady?.();
      return;
    }

    const ctx = getOrCreateContext();

    // Resume context if suspended (needed on some browsers)
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch {}
    }

    // Count total sounds
    const allSounds: { subjectId: string; sound: ResolvedSound }[] = [];
    for (const subject of subjects) {
      for (const sound of subject.sounds) {
        allSounds.push({ subjectId: subject.subjectId, sound });
      }
    }

    loadTotal = allSounds.length;
    loadProgress = 0;

    // Initialise map with null buffers
    for (const subject of subjects) {
      decodedMap.set(
        subject.subjectId,
        subject.sounds.map(s => ({ ...s, buffer: null }))
      );
    }

    // Fetch + decode all in parallel (with concurrency cap of 4)
    const CONCURRENCY = 4;
    let idx = 0;

    async function worker() {
      while (idx < allSounds.length) {
        const current = allSounds[idx++];
        try {
          const response = await fetch(current.sound.url);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

          // Store decoded buffer
          const list = decodedMap.get(current.subjectId);
          if (list) {
            const entry = list.find(s => s.id === current.sound.id);
            if (entry) entry.buffer = audioBuffer;
          }
        } catch (err) {
          // Non-fatal: log and continue; that sound will be silently skipped
          console.warn(`[AudioEngine] Failed to preload ${current.sound.url}:`, err);
        } finally {
          loadProgress++;
        }
      }
    }

    const workers = Array.from({ length: Math.min(CONCURRENCY, allSounds.length) }, () => worker());
    await Promise.all(workers);

    isReady = true;
    onReady?.();
  }

  // ── Playback ────────────────────────────────────────────────────────────

  function stopCurrent() {
    // Cancel all pending timeouts
    for (const t of currentTimeouts) clearTimeout(t);
    currentTimeouts = [];

    // Stop all playing sources
    for (const source of currentSources) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {}
    }
    currentSources = [];
    currentSubjectId = null;
  }

  /**
   * Play all sounds for a subject sequentially, honouring delayBeforeMs.
   * If the subject is already playing, stop and restart.
   * If a different subject is playing, stop it and start the new one.
   */
  export function play(subjectId: string) {
    // Stop whatever is currently playing
    stopCurrent();

    const ctx = getOrCreateContext();
    // Resume context if suspended (e.g. after page focus loss)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const decoded = decodedMap.get(subjectId);
    if (!decoded || decoded.length === 0) return;

    currentSubjectId = subjectId;

    // Filter to only sounds with successfully decoded buffers
    const playable = decoded.filter(s => s.buffer !== null);
    if (playable.length === 0) return;

    // Schedule each sound: accumulate absolute time from now
    let accumulatedDelay = 0;

    for (let i = 0; i < playable.length; i++) {
      const sound = playable[i];
      accumulatedDelay += sound.delayBeforeMs;

      const capturedDelay = accumulatedDelay;
      const capturedBuffer = sound.buffer!;
      const capturedSubjectId = subjectId;

      const t = setTimeout(() => {
        // Safety check: make sure we're still supposed to be playing this subject
        if (currentSubjectId !== capturedSubjectId) return;

        try {
          const source = ctx.createBufferSource();
          source.buffer = capturedBuffer;
          source.connect(ctx.destination);
          source.start();
          currentSources.push(source);

          // Remove from active sources when done
          source.onended = () => {
            const idx = currentSources.indexOf(source);
            if (idx !== -1) currentSources.splice(idx, 1);
            try { source.disconnect(); } catch {}
          };
        } catch (err) {
          console.warn('[AudioEngine] Playback error:', err);
        }
      }, capturedDelay);

      currentTimeouts.push(t);
    }
  }

  /**
   * Immediately stop all audio.
   */
  export function stop() {
    stopCurrent();
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────

  onMount(() => {
    preloadAll();
  });

  onDestroy(() => {
    stopCurrent();
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
      audioCtx = null;
    }
  });

  // React to subjects prop changes (e.g. navigating to a different topic)
  $effect(() => {
    // subjects is the reactive dependency
    const _ = subjects;
    isReady = false;
    loadProgress = 0;
    loadTotal = 0;
    decodedMap = new Map();
    stopCurrent();
    preloadAll();
  });
</script>

<!--
  AudioEngine is a headless component — no visible DOM output.
  It exposes play(subjectId) and stop() for parent components to call.

  Loading progress is available via the isReady and loadProgress/loadTotal bindings
  if the parent wants to show a preload indicator.
-->
{#if !isReady && loadTotal > 0}
  <!-- Optionally rendered slot for loading indicator -->
  <slot name="loading" {loadProgress} {loadTotal}>
    <!-- Default: nothing visible -->
  </slot>
{/if}