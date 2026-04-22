<script lang="ts">
  import { onMount } from 'svelte';
  import MusicNoteIcon from 'phosphor-svelte/lib/MusicNoteIcon.svelte';
  import CheckCircleIcon from 'phosphor-svelte/lib/CheckCircleIcon.svelte';

  interface Voice {
    id: string;
    label: string;
    language: string;
  }

  interface Sound {
    id: string;
    subject_id: string;
    sort_order: number;
    delay_before_ms: number;
    type: 'text' | 'file';
    text_content: string | null;
    language: string | null;
    voice: string | null;
    file_key: string | null;
  }

  let { voices = [] }: { voices: Voice[] } = $props();

  let subjectId = $state('');
  let sounds = $state<Sound[]>([]);
  let loading = $state(false);
  let saving = $state(false);
  let previewingId = $state<string | null>(null);

  onMount(() => {
    document.addEventListener('selectSubject', async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      subjectId = detail.subjectId;
      await loadSounds();
    });
  });

  async function loadSounds() {
    if (!subjectId) return;
    loading = true;
    try {
      const res = await fetch(`/api/admin/sounds?subject_id=${subjectId}`);
      if (res.ok) {
        sounds = await res.json();
      }
    } finally {
      loading = false;
    }
  }

  async function addSound() {
    if (!subjectId) return;
    const newSort = sounds.length;
    const newDelayMs = sounds.length === 0 ? 0 : 800;
    try {
      const res = await fetch('/api/admin/sounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject_id: subjectId,
          type: 'text',
          sort_order: newSort,
          delay_before_ms: newDelayMs,
        }),
      });
      if (res.ok) {
        const s: Sound = await res.json();
        sounds = [...sounds, s];
      }
    } catch {}
  }

  async function removeSound(id: string) {
    if (!confirm('Remove this sound?')) return;
    try {
      await fetch('/api/admin/sounds', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      sounds = sounds.filter(s => s.id !== id);
    } catch {}
  }

  async function updateSound(id: string, patch: Partial<Sound>) {
    saving = true;
    try {
      await fetch('/api/admin/sounds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      });
      sounds = sounds.map(s => s.id === id ? { ...s, ...patch } : s);
    } finally {
      saving = false;
    }
  }

  async function moveSound(index: number, dir: -1 | 1) {
    const swapIdx = index + dir;
    if (swapIdx < 0 || swapIdx >= sounds.length) return;
    const newSounds = [...sounds];
    [newSounds[index], newSounds[swapIdx]] = [newSounds[swapIdx], newSounds[index]];
    // Reassign sort_orders
    const updates = newSounds.map((s, i) => ({ ...s, sort_order: i }));
    sounds = updates;
    saving = true;
    try {
      for (const s of updates) {
        await fetch('/api/admin/sounds', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id, sort_order: s.sort_order }),
        });
      }
    } finally {
      saving = false;
    }
  }

  async function uploadFile(soundId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefix', `audio/uploads/${soundId}`);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const { key } = await res.json();
        await updateSound(soundId, { file_key: key });
      } else {
        alert('File upload failed');
      }
    } catch {
      alert('File upload error');
    }
  }

  async function previewSequence() {
    if (!subjectId) return;
    previewingId = subjectId;
    try {
      const res = await fetch(`/api/subjects/${subjectId}/sounds`);
      if (!res.ok) {
        alert('Could not load sounds for preview');
        return;
      }
      const data = await res.json();
      if (!data.sounds?.length) {
        alert('No playable sounds found. Make sure sounds have text content or uploaded files.');
        return;
      }
      const ctx = new AudioContext();
      for (const sound of data.sounds) {
        if (sound.delayBeforeMs > 0) {
          await new Promise<void>(resolve => setTimeout(resolve, sound.delayBeforeMs));
        }
        try {
          const audioRes = await fetch(sound.url);
          if (!audioRes.ok) continue;
          const buf = await audioRes.arrayBuffer();
          const decoded = await ctx.decodeAudioData(buf);
          const source = ctx.createBufferSource();
          source.buffer = decoded;
          source.connect(ctx.destination);
          source.start();
          await new Promise<void>(resolve => {
            source.onended = () => resolve();
            setTimeout(resolve, 10000); // safety timeout
          });
        } catch {}
      }
    } catch (err) {
      alert('Preview failed: ' + String(err));
    } finally {
      previewingId = null;
    }
  }

  function languagesFromVoices(): string[] {
    return [...new Set(voices.map(v => v.language))];
  }

  function voicesForLanguage(lang: string): Voice[] {
    return voices.filter(v => v.language === lang);
  }

  function handleTypeChange(sound: Sound, newType: 'text' | 'file') {
    updateSound(sound.id, { type: newType });
  }

  function handleDelayChange(sound: Sound, value: string) {
    const ms = parseInt(value, 10);
    if (!isNaN(ms) && ms >= 0) {
      updateSound(sound.id, { delay_before_ms: ms });
    }
  }

  function handleTextChange(sound: Sound, value: string) {
    updateSound(sound.id, { text_content: value });
  }

  function handleLanguageChange(sound: Sound, lang: string) {
    const firstVoice = voicesForLanguage(lang)[0];
    updateSound(sound.id, {
      language: lang,
      voice: firstVoice?.id ?? sound.voice,
    });
  }

  function handleVoiceChange(sound: Sound, voiceId: string) {
    updateSound(sound.id, { voice: voiceId });
  }
</script>

{#if subjectId}
  <div style="border-top: 1.5px solid #e2e8f0; padding-top: 20px; margin-top: 16px;">
    <!-- Header -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="font-size:15px; font-weight:800; color:#1e293b;">Sounds</span>
        {#if saving}
          <span style="font-size:12px; color:#94a3b8; font-style:italic;">Saving…</span>
        {/if}
      </div>
      <div style="display:flex; gap:8px;">
        <button
          onclick={previewSequence}
          disabled={previewingId !== null || sounds.length === 0}
          style="background:#FFF9E6; border:1.5px solid #FFD93D; color:#92400e; border-radius:8px; padding:7px 14px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.15s; disabled:opacity:0.5;"
        >
          {previewingId ? '▶ Playing…' : '▶ Preview All'}
        </button>
        <button
          onclick={addSound}
          style="background:#6BCB77; color:white; border:none; border-radius:8px; padding:7px 16px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer; transition:background 0.15s;"
          onmouseover={() => {}}
        >
          + Add Sound
        </button>
      </div>
    </div>

    <!-- Sound list -->
    {#if loading}
      <div style="text-align:center; color:#94a3b8; padding:32px 0; font-size:14px;">
        Loading sounds…
      </div>
    {:else if sounds.length === 0}
      <div style="text-align:center; color:#94a3b8; padding:32px 0; font-size:14px; border:2px dashed #e2e8f0; border-radius:10px;">
        No sounds yet.<br />
        <span style="font-size:13px;">Add a sound to make this subject come alive!</span>
      </div>
    {:else}
      {#each sounds as sound, i (sound.id)}
        <div style="background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:10px; padding:16px; margin-bottom:10px;">
          <!-- Sound header row -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="background:#e0f2fe; color:#0369a1; font-size:12px; font-weight:800; padding:2px 8px; border-radius:20px;">
                #{i + 1}
              </span>
              {#if sound.type === 'text'}
                <span style="font-size:13px; color:#475569; font-weight:700;">
                  {sound.text_content ? `"${sound.text_content}"` : '(empty text)'}
                </span>
              {:else}
                <span style="font-size:13px; color:#475569; font-weight:700;">
                  {#if sound.file_key}
                    <span style="display:inline-flex;align-items:center;gap:4px;"><MusicNoteIcon weight="bold" size={14} /> Audio file</span>
                  {:else}
                    (no file)
                  {/if}
                </span>
              {/if}
            </div>
            <div style="display:flex; gap:6px;">
              <button
                onclick={() => moveSound(i, -1)}
                disabled={i === 0}
                title="Move up"
                style="background:#e2e8f0; border:none; border-radius:6px; padding:5px 10px; cursor:pointer; font-size:13px; font-family:inherit; opacity:{i === 0 ? 0.4 : 1};"
              >↑</button>
              <button
                onclick={() => moveSound(i, 1)}
                disabled={i === sounds.length - 1}
                title="Move down"
                style="background:#e2e8f0; border:none; border-radius:6px; padding:5px 10px; cursor:pointer; font-size:13px; font-family:inherit; opacity:{i === sounds.length - 1 ? 0.4 : 1};"
              >↓</button>
              <button
                onclick={() => removeSound(sound.id)}
                style="background:#fee2e2; color:#ef4444; border:none; border-radius:6px; padding:5px 12px; font-size:13px; font-weight:700; font-family:inherit; cursor:pointer;"
              >
                Remove
              </button>
            </div>
          </div>

          <!-- Controls row -->
          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:12px;">
            <!-- Type -->
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">Type</label>
              <select
                value={sound.type}
                onchange={(e: Event) => handleTypeChange(sound, (e.target as HTMLSelectElement).value as 'text' | 'file')}
                style="border:1.5px solid #cbd5e1; border-radius:7px; padding:6px 10px; font-size:13px; font-family:inherit; background:white; outline:none;"
              >
                <option value="text">Text (TTS)</option>
                <option value="file">File (Upload)</option>
              </select>
            </div>

            <!-- Delay -->
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">Delay before (ms)</label>
              <input
                type="number"
                value={sound.delay_before_ms}
                min="0"
                step="100"
                onchange={(e: Event) => handleDelayChange(sound, (e.target as HTMLInputElement).value)}
                style="width:100px; border:1.5px solid #cbd5e1; border-radius:7px; padding:6px 10px; font-size:13px; font-family:inherit; outline:none;"
              />
            </div>
          </div>

          <!-- Text TTS fields -->
          {#if sound.type === 'text'}
            <div style="display:flex; gap:10px; flex-wrap:wrap;">
              <!-- Text content -->
              <div style="flex:1; min-width:160px;">
                <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">Text</label>
                <input
                  type="text"
                  value={sound.text_content ?? ''}
                  placeholder="e.g. Dog or Woof!"
                  onchange={(e: Event) => handleTextChange(sound, (e.target as HTMLInputElement).value)}
                  style="width:100%; border:1.5px solid #cbd5e1; border-radius:7px; padding:7px 10px; font-size:14px; font-family:inherit; outline:none; transition:border-color 0.15s;"
                  onfocus={(e: FocusEvent) => { (e.target as HTMLInputElement).style.borderColor = '#4BA3FF'; }}
                  onblur={(e: FocusEvent) => { (e.target as HTMLInputElement).style.borderColor = '#cbd5e1'; }}
                />
              </div>

              <!-- Language -->
              {#if voices.length > 0}
                <div>
                  <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">Language</label>
                  <select
                    value={sound.language ?? 'en-US'}
                    onchange={(e: Event) => handleLanguageChange(sound, (e.target as HTMLSelectElement).value)}
                    style="border:1.5px solid #cbd5e1; border-radius:7px; padding:6px 10px; font-size:13px; font-family:inherit; background:white; outline:none;"
                  >
                    {#each languagesFromVoices() as lang}
                      <option value={lang}>{lang}</option>
                    {/each}
                  </select>
                </div>

                <!-- Voice -->
                <div>
                  <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">Voice</label>
                  <select
                    value={sound.voice ?? 'en-US-AvaMultilingualNeural'}
                    onchange={(e: Event) => handleVoiceChange(sound, (e.target as HTMLSelectElement).value)}
                    style="border:1.5px solid #cbd5e1; border-radius:7px; padding:6px 10px; font-size:13px; font-family:inherit; background:white; outline:none;"
                  >
                    {#each voicesForLanguage(sound.language ?? 'en-US') as v}
                      <option value={v.id}>{v.label}</option>
                    {/each}
                  </select>
                </div>
              {/if}
            </div>

            {#if sound.text_content}
              <div style="margin-top:8px; font-size:12px; color:#f59e0b; font-weight:700;">
                ⏳ TTS will be generated on first play
              </div>
            {/if}

          <!-- File upload fields -->
          {:else}
            <div>
              <label style="display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:4px;">Audio File (MP3)</label>
              {#if sound.file_key}
                <div style="font-size:12px; color:#6BCB77; font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
                    <CheckCircleIcon weight="bold" size={14} /> {sound.file_key.split('/').pop()}
                  </div>
              {/if}
              <input
                type="file"
                accept="audio/mpeg,audio/mp3,.mp3"
                onchange={(e: Event) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) uploadFile(sound.id, file);
                }}
                style="font-size:13px; font-family:inherit;"
              />
            </div>
          {/if}
        </div>
      {/each}
    {/if}

    {#if sounds.length > 0}
      <div style="margin-top:6px; padding:10px 14px; background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:8px; font-size:13px; color:#15803d;">
        <strong>Playback order:</strong>
        {#each sounds as sound, i}
          <span>
            {#if i > 0} → {/if}
            {sound.type === 'text'
              ? (sound.text_content ? `"${sound.text_content}"` : '(empty)')
              : ''}
            {#if sound.type === 'file'}
              <MusicNoteIcon weight="bold" size={13} style="vertical-align:middle;" />
            {/if}
            {#if sound.delay_before_ms > 0}
              <span style="color:#92400e;">(+{sound.delay_before_ms}ms)</span>
            {/if}
          </span>
        {/each}
      </div>
    {/if}
  </div>
{/if}