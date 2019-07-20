<script>
  import { afterUpdate } from "svelte";
  import Album from "./Album/index.svelte";
  import {
    sortedAlbums,
    isLoading,
    filterYandex,
    filterGoogle
  } from "../stores/albums";
  import Loader from "./Loader.svelte";

  let container;
  const scrollToTop = () => {
    if (container) container.scrollTop = 0;
  };
  filterYandex.subscribe(scrollToTop);
  filterGoogle.subscribe(scrollToTop);
  let trigger;
  let limit = 11;
  const options = {
    root: document.querySelector(".main"),
    rootMargin: "10px",
    threshold: 1.0
  };
  const callback = function(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        limit = +entry.target.getAttribute("index") + 10;
      }
    });
  };
  const observer = new IntersectionObserver(callback, options);

  afterUpdate(() => {
    if (trigger) observer.observe(trigger);
  });
</script>

<style>
  .main {
    flex-grow: 1;
    overflow: auto;
    background: #f5f5f5;
  }
  @media (min-width: 600px) {
    .main {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
  }
</style>

<main class="main" bind:this={container}>
  {#if $isLoading}
    <Loader />
  {:else}
    {#each $sortedAlbums.slice(0, limit) as album, index (album.album_id)}
      <Album {album} />
      {#if (index + 1) % 5 === 0 || index + 1 === limit}
        <span bind:this={trigger} {index} />
      {/if}
    {/each}
  {/if}

</main>
