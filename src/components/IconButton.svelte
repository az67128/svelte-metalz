<script>
  export let onClick = () => {};
</script>

<style>
  .button {
    position: relative;
    background: none;
    cursor: pointer;
    border: none;
    padding: 0;
    margin: 0;
    height: 24px;
    color: inherit;
    font-size: 1rem;
    outline: none;
  }
  @media (any-hover: none) {
    .button {
      outline: none;
    }
  }
</style>

<button on:click={onClick} class="button">

  <slot />

</button>
