<script>
  import { afterUpdate } from "svelte";
  import pannable from "../utils/pannable";
  import { spring } from "svelte/motion";
  import Album from "./Album/index.svelte";
  import {
    sortedAlbums,
    isLoading,
    filterYandex,
    filterGoogle,
    currentMonth
  } from "../stores/albums";
  import Loader from "./Loader.svelte";

  let container;
  const scrollToTop = () => {
    if (container) container.scrollTop = 0;
  };

  filterYandex.subscribe(scrollToTop);
  filterGoogle.subscribe(scrollToTop);

  // ------------------Pannable
  let startX = 0;
  const coords = spring(0, {
    stiffness: 0.2,
    damping: 0.4
  });

  function handlePanStart() {
    startX = 0;
    coords.stiffness = coords.damping = 1;
  }

  function handlePanMove(event) {
    coords.update($coords => $coords + event.detail.dx);
  }

  function handlePanEnd(event) {
    const delta = startX - $coords;

    if (Math.abs(delta) < window.innerWidth / 3) {
      coords.stiffness = 0.2;
      coords.damping = 0.4;
      coords.set(0);
      return;
    } else {
      coords.stiffness = 1;
      coords.damping = 1;
      coords.set(0);
    }
    coords.set(0);
    if (delta > 0) {
      currentMonth.nextMonth();
    } else {
      currentMonth.prevMonth();
    }
  }
  // ------------------
  let trigger;
  let limit = 11;
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          limit = +entry.target.getAttribute("index") + 10;
        }
      });
    },
    {
      root: document.querySelector(".main"),
      rootMargin: "10px",
      threshold: 0.1
    }
  );
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
    .wrapper {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }
  }
  .wrapper {
    width: 100%;
    height: 100%;
    overflow: auto;
  }
</style>

<main class="main" bind:this={container}>
  <div
    class="wrapper"
    use:pannable
    on:panstart={handlePanStart}
    on:panmove={handlePanMove}
    on:panend={handlePanEnd}
    style="transform: translate({$coords}px,0px)">
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
  </div>

</main>
