<script>
  import { coverPreviewSrc } from "../stores/albums";
  import { fade, fly } from "svelte/transition";
  import CloseIcon from "../assets/CloseIcon.svelte";
  import IconButton from "./IconButton.svelte";
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
  .close {
    position: fixed;
    top: 1rem;
    right: 1rem;
  }
</style>

{#if $coverPreviewSrc}
  <div
    class="coverPreview"
    on:click={() => coverPreviewSrc.set(null)}
    transition:fade={{ duration: 200 }}>
    <div class="close">
      <IconButton on:click={() => coverPreviewSrc.set(null)}>
        <CloseIcon />
      </IconButton>
    </div>
    <img
      src={$coverPreviewSrc}
      alt="cover-preview"
      transition:fly={{ duration: 200 }} />
  </div>
{/if}
