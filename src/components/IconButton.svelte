<style>
  .button {
    background: none;
    cursor: pointer;
    border: none;
  }
  @media (any-hover: none) {
    .button {
      outline: none;
    }
  }
</style>
<button class="button">
	<slot></slot>
</button>