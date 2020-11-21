<script lang="ts">
  import { getLaunches, GetLaunchesWithArgs } from "src/codegen";
  import type { GetLaunchesWithArgsQuery } from "src/codegen";

  let limit = 10;
  let loading = true;

  let launchWithArgs: GetLaunchesWithArgsQuery = { launches: [] };

  $: q = GetLaunchesWithArgs({ limit });

  $: (async () => {
    try {
      loading = true;
      let result = await $q;
      loading = false;
      launchWithArgs = result.data;
    } catch (e) {
      console.log("Error fetching last launches: ", e);
    }
  })();
</script>

<style>
  .flex {
    display: flex;
  }
</style>

<button on:click={(_) => (limit = 10)}>Last 10 launches</button>
<button on:click={(_) => (limit = 20)}>Last 20 launches</button>

{#if loading}Loading{/if}

<main>
  <h1>SpaceX launches</h1>
  <div class="flex">
    <div>
      {#each $getLaunches.launches || [] as launch}
        <div>{launch.mission_id}</div>
        <div>{launch.mission_name}</div>
      {/each}
    </div>
    <div>
      {#each launchWithArgs?.launches as launch}
        <div>{launch.mission_id}</div>
        <div>{launch.mission_name}</div>
      {/each}
    </div>
  </div>
</main>
