<script lang="ts">
  import { fade } from 'svelte/transition';
  import { GetLaunches } from 'src/codegen';
  import CLaunch from '../components/CLaunch.svelte';
  import { Wave } from 'svelte-loading-spinners';

  $: query = GetLaunches({});
</script>

<style>
  .cards {
    display: flex;
    justify-content: space-around;
  }

  .card {
    padding: 10px;
    background-color: rgb(173, 196, 178);
    box-shadow: 10px 5px 5px #ff3e00;
  }
</style>

<br />
<main class="cards">
  <div class="card">
    <h2>SpaceX all launches</h2>
    {#if $query.loading}
      <Wave size="100" color="#FF3E00" unit="px" />
    {/if}
    {#each $query.data?.launches || [] as launch (launch.mission_id)}
      <div transition:fade>
        <CLaunch {launch} />
      </div>
    {/each}
  </div>
</main>
