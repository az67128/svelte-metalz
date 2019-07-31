<script>
  import { coverPreviewSrc } from "../stores/albums";
  import { fade, fly } from "svelte/transition";
  import CloseIcon from "../assets/CloseIcon.svelte";
  import IconButton from "./IconButton.svelte";
  import Loader from "./Loader.svelte";
  import translate from "../utils/translation";

  let isLoading = true;
  const close = () => {
    coverPreviewSrc.set(null);
    isLoading = true;
  };
</script>

<style>
  .coverPreview {
    z-index: 2;
    position: fixed;
    top: 0px;
    left: 0px;
    height: 100%;
    width: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (orientation: landscape) {
    .coverPreview img {
      max-height: 100%;
    }
  }

  @media (orientation: portrait) {
    .coverPreview img {
      max-width: 100%;
    }
  }
  .coverPreview img {
    transition: all 0.5s ease;
  }
  .close {
    position: fixed;
    top: 1rem;
    right: 1rem;
  }
  .isLoading {
    opacity: 0;
  }
  .loader {
    position: absolute;
  }
</style>

{#if $coverPreviewSrc}
  <div
    class="coverPreview"
    on:click={close}
    transition:fade={{ duration: 200 }}>
    <div class="close">
      <IconButton on:click={close}>
        <CloseIcon />
      </IconButton>
    </div>
    {#if isLoading}
      <div class="loader">
        <Loader />
      </div>
    {/if}
    <img
      src={$coverPreviewSrc}
      alt="cover-preview"
      transition:fly={{ duration: 200 }}
      on:load={e => {
        isLoading = false;
      }}
      class:isLoading />

  </div>
{/if}
