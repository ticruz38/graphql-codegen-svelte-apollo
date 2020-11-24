<script>
  import { Router, Link, Route } from 'svelte-routing';
  import PageLaunches from './routes/PageLaunches.svelte';
  import PageLaunchesWithArgs from './routes/PageLaunchesWithArgs.svelte';
  import NavLink from './components/NavLink.svelte';

  export let url = '';
</script>

<style>
  .title {
    background-color: #444444;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: xx-large;
  }

  nav {
    background-color: #ff3e00;
    height: 60px;
    display: flex;
    justify-content: space-around;
    align-items: center;
    color: white;
  }
</style>

<div class="title">graphql-codegen-svelte-apollo</div>

<Router {url}>
  <nav>
    <NavLink to="/">Launches</NavLink>
    <NavLink to="withArgs">Launches (withArgs)</NavLink>
  </nav>
  <div>
    <Route path="withArgs" component={PageLaunchesWithArgs} />
    <Route path="/" component={PageLaunches} />
  </div>
</Router>
