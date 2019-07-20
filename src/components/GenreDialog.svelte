<script>
  import genres from "../utils/genres";
  import IconButton from "./IconButton.svelte";
  import LeftArrowIcon from "../assets/LeftArrowIcon.svelte";
  import { showGenreDialog, selectedGenres } from "../stores/albums";
  import translate from "../utils/translation";
  import { fly } from "svelte/transition";
  const close = () => {
    showGenreDialog.set(false);
    selectedGenres.reset();
  };
</script>

<style>
  .genreSelect {
    z-index: 2;
    background: white;
    position: fixed;
    top: 0px;
    bottom: 0px;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  header {
    padding: 1rem;
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12);
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
  }
  main {
    flex-grow: 1;
    overflow: auto;
    padding: 1rem;
    background: #f5f5f5;
  }

  .button {
    background: none;
    outline: none;
    padding: 0;
    margin: 0;
    border: none;
    cursor: pointer;
  }
  .selected {
    color: #b2102f;
  }
  .genre {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
    display: block;
  }
  .genre:hover {
    color: #b2102f;
  }
</style>

{#if $showGenreDialog}
  <div class="genreSelect" transition:fly={{ x: -200, duration: 300 }}>
    <header>
      <IconButton onClick={() => showGenreDialog.set(false)}>
        <LeftArrowIcon />
      </IconButton>
      <div>{translate('genreSelectTitle')}</div>
      <button class="button" on:click={close}>RESET</button>
    </header>
    <main>
      {#each genres as genre, index (genre)}
        <button
          class="genre button"
          class:selected={$selectedGenres.some(item => item === genre)}
          on:click={() => selectedGenres.toggle(genre)}>
          {genre}
        </button>
      {/each}
    </main>
  </div>
{/if}
