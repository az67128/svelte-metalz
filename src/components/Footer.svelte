<script>
  import IconButton from "./IconButton.svelte";
  import YandexIcon from "../assets/YandexIcon.svelte";
  import GoogleIcon from "../assets/GoogleIcon.svelte";
  import { filterYandex, filterGoogle, sortByAphabet } from "../stores/albums";
</script>

<style>
  footer {
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
</style>

<footer>
  <IconButton onClick={() => filterYandex.update(state => !state)}>
    <YandexIcon />
  </IconButton>
  <IconButton onClick={() => filterGoogle.update(state => !state)}>
    <GoogleIcon />
  </IconButton>
  <IconButton onClick={() => sortByAphabet.update(state => !state)}>
    {$sortByAphabet ? 'AZ' : '321'}
  </IconButton>
</footer>
