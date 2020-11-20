<script lang="ts">
  import {
    getLaunches,
    GetLaunchesWithArgs,
    GetLaunchesWithArgsQuery,
  } from "../codegen";

  let limit = 10;

  let launchWithArgs: GetLaunchesWithArgsQuery = { launches: [] };

  $: q = GetLaunchesWithArgs({ limit });

  $: (async () => {
    try {
      let result = await $q;
      launchWithArgs = result.data;
    } catch (e) {
      console.log("Error fetching last launches: ", e);
    }
  })();
</script>

<button on:click={(_) => (limit = 10)}>Last 10 launches</button>
<button on:click={(_) => (limit = 20)}>Last 20 launches</button>

<main>
  <h1>SpaceX launches</h1>
  {#each $getLaunches.launches as launch}
    <div>{launch.mission_id}</div>
    <div>{launch.mission_name}</div>
  {/each}
  {#each launchWithArgs.launches as launch}
    <div>{launch.mission_id}</div>
    <div>{launch.mission_name}</div>
  {/each}
</main>
