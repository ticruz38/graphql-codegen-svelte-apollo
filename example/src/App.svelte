<script lang="ts">
  import {
    GetLaunches,
    GetLaunchesWithArgs,
    NewUser,
    UpdateUser,
  } from "src/codegen";

  let limit = 10;
  let users = [];

  $: l = GetLaunches({});

  $: q = GetLaunchesWithArgs({ variables: { limit } });

  $: newUser = NewUser({ variables: {} });

  $: {
    if ($newUser && !$newUser.errors) {
      users = [...users, ...$newUser?.data?.users?.map((u) => u.name)];
    } else {
      console.error($newUser && $newUser.errors);
    }
  }

  async function updateUser() {
    const res = await UpdateUser({
      variables: {
        where: { id: { _eq: "1" } },
        user: { id: "1", name: "codegenerator" },
      },
    });
    if (res.errors) {
      console.log(res.errors);
    } else {
      console.log(res.data.update_users.returning.map((r) => r.name));
    }
  }
</script>

<style>
  .flex {
    display: flex;
  }
</style>

<button on:click={(_) => (limit = 10)}>Last 10 launches</button>
<button on:click={(_) => (limit = 20)}>Last 20 launches</button>

<button on:click={(_) => $q.query.refetch({ limit })}>Refetch</button>
<button on:click={(_) => updateUser()}>Update user</button>

<main class="flex">
  <div>
    <h1>SpaceX launches</h1>
    {#each $l.data?.launches || [] as launch}
      <div>{launch.mission_id}</div>
      <div>{launch.mission_name}</div>
    {/each}
  </div>
  <div>
    <h1>SpaceX last {limit} launches</h1>
    {#each $q.data?.launches || [] as launch}
      <div>{launch.mission_id}</div>
      <div>{launch.mission_name}</div>
    {/each}
  </div>
</main>
