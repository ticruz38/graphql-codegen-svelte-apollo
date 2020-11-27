<script lang="ts">
  import type { Launch } from '../codegen';
  export let launch: Launch;
</script>

<div>
  {launch.mission_id.length === 0 ? '???????' : launch.mission_id[0]}
  -
  {launch.mission_name}
</div>
