<script>
  import Album from "./Album/index.svelte";
  import { albums, isLoading } from "../stores/albums";
  import Loader from "./Loader.svelte";
</script>

<style>
  .main {
    flex-grow: 1;
    overflow: auto;
    background: #f5f5f5;
  }
</style>

<main class="main">
  {#if $isLoading}
    <Loader />
  {:else}
    {#each $albums.slice(0, 10) as album, index (album.album_id)}
      <Album {album} />
    {/each}
  {/if}

</main>
