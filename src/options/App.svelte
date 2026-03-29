<script lang="ts">
  import { onMount } from "svelte";
  import Button from "../lib/components/ui/button/button.svelte";
  import { getSettings, saveSettings } from "../lib/storage";
  import type {
    AudienceMode,
    EnglishLevel,
    ExplanationOrder,
    TechnicalFamiliarity,
    UserSettings,
    Verbosity
  } from "../lib/types";
  import { DEFAULT_SETTINGS } from "../lib/types";

  let settings: UserSettings = { ...DEFAULT_SETTINGS };
  let isSaving = false;
  let status = "";

  const audienceModes: AudienceMode[] = ["general", "non_native", "older_generation", "non_technical"];
  const verbosityModes: Verbosity[] = ["brief", "balanced", "detailed"];
  const englishLevels: EnglishLevel[] = ["beginner", "intermediate", "advanced"];
  const technicalLevels: TechnicalFamiliarity[] = ["beginner", "intermediate", "advanced"];
  const explanationOrders: ExplanationOrder[] = ["meaning_first", "simpler_first"];

  onMount(async () => {
    settings = await getSettings();
  });

  async function handleSave() {
    isSaving = true;
    status = "";
    await saveSettings(settings);
    isSaving = false;
    status = "Settings saved.";
    setTimeout(() => {
      status = "";
    }, 1800);
  }
</script>

<main class="mx-auto w-full max-w-2xl p-6">
  <div class="rounded-lg border border-border bg-card p-6 shadow-card">
    <header class="mb-5">
      <h1 class="text-xl font-semibold">Clarity Settings</h1>
      <p class="mt-1 text-sm text-muted-foreground">Configure Gemini and explanation preferences.</p>
    </header>

    <form class="space-y-4" on:submit|preventDefault={handleSave}>
      <label class="block space-y-1">
        <span class="text-sm font-medium">Gemini API Key</span>
        <input
          type="password"
          class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          bind:value={settings.apiKey}
          placeholder="AIza..."
          autocomplete="off"
          required
        />
      </label>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="block space-y-1">
          <span class="text-sm font-medium">Audience Mode</span>
          <select
            class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={settings.audienceMode}
          >
            {#each audienceModes as mode}
              <option value={mode}>{mode}</option>
            {/each}
          </select>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium">Verbosity</span>
          <select
            class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={settings.verbosity}
          >
            {#each verbosityModes as mode}
              <option value={mode}>{mode}</option>
            {/each}
          </select>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium">Native Language</span>
          <input
            type="text"
            class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={settings.nativeLanguage}
            required
          />
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium">English Level</span>
          <select
            class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={settings.englishLevel}
          >
            {#each englishLevels as level}
              <option value={level}>{level}</option>
            {/each}
          </select>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium">Technical Familiarity</span>
          <select
            class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={settings.technicalFamiliarity}
          >
            {#each technicalLevels as level}
              <option value={level}>{level}</option>
            {/each}
          </select>
        </label>

        <label class="block space-y-1">
          <span class="text-sm font-medium">Popup Order</span>
          <select
            class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            bind:value={settings.explanationOrder}
          >
            {#each explanationOrders as order}
              <option value={order}>{order}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSaving}>{isSaving ? "Saving..." : "Save Settings"}</Button>
        {#if status}
          <span class="text-sm text-muted-foreground">{status}</span>
        {/if}
      </div>
    </form>
  </div>
</main>
