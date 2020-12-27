<script lang="ts">
  import {
    AddCodegenUser,
    DeleteCodegenUser,
    GetCodegenUsers,
    GetCodegenUsersDoc,
  } from "src/codegen";

  $: userName = "";
  $: query = GetCodegenUsers({});
</script>

<style>
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

<br />
<main class="cards">
  <div class="card">
    <h2>Add User</h2>
    <input placeholder="User name..." bind:value={userName} />
    <button
      disabled={userName.length === 0}
      on:click={() => {
        AddCodegenUser({ variables: { userName } });
        // you can "auto refresh queries" adding the code bellow to AddCodegenUser (but here we want to demo the manual refresh button)
        // refetchQueries: [{ query: GetCodegenUsersDoc }],
        userName = '';
      }}>Add</button>
  </div>
  <div class="card">
    <h2>List of Codegen Users</h2>
    {#if $query.loading}
      <p>...loading users</p>
    {:else}
      {#if $query.data?.users.length === 0}
        <p>No User (Add some!)</p>
      {/if}
      {#each $query.data?.users || [] as user, i}
        <div>User {i + 1} -&gt; {user.name}</div>
      {/each}
      <button on:click={() => $query.query.refetch({})}>Refresh</button>
      <button
        style="float: right"
        on:click={() => {
          DeleteCodegenUser({
            refetchQueries: [{ query: GetCodegenUsersDoc }],
          });
        }}>Delete all</button>
    {/if}
  </div>
</main>
