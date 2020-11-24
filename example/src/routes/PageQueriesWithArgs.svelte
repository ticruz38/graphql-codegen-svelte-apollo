<script lang="ts">
  import { GetLaunchesWithArgs } from 'src/codegen';
  import CLaunch from '../components/CLaunch.svelte';

  let limit = 10;
  $: query = GetLaunchesWithArgs({ variables: { limit } });
</script>

<style>
  .args {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 40px;
    padding: 10px;
  }

  button {
    margin-left: 10px;
  }

  .selected {
    background-color: #ff3e00;
  }

  .cards {
    display: flex;
    justify-content: center;
  }

  .card {
    padding: 10px;
    background-color: rgb(173, 196, 178);
    box-shadow: 10px 5px 5px #ff3e00;
    margin: 20px;
  }
</style>

<div class="args">
  Number of Launches:
  <button
    class:selected={limit === 10}
    on:click={() => (limit = 10)}>10</button>
  <button
    class:selected={limit === 20}
    on:click={() => (limit = 20)}>20</button>
</div>

<main class="cards">
  <div class="card">
    <h2>SpaceX last {limit} launches (1)</h2>
    {#if $query.loading}
      <p>...loading {limit} launches</p>
    {/if}
    {#each $query.data?.launches || [] as launch (launch.mission_id)}
      <CLaunch {launch} />
    {/each}
  </div>
  <div class="card">
    <h2>SpaceX last {limit} launches (2)</h2>
    {#if $query.loading}
      <p>...loading {limit} launches</p>
    {/if}
    {#each $query.data?.launches || [] as launch}
      <CLaunch {launch} />
    {/each}
  </div>
</main>
