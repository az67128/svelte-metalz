<script>
  import IconButton from "./IconButton.svelte";
  import YandexIcon from "../assets/YandexIcon.svelte";
  import GoogleIcon from "../assets/GoogleIcon.svelte";
  import GuitarIcon from "../assets/GuitarIcon.svelte";
  import {
    filterYandex,
    filterGoogle,
    sortByAphabet,
    showGenreDialog,
    selectedGenres
  } from "../stores/albums";

  const openGenreDialog = () => {
    history.pushState({}, "Select genre", "/");
    showGenreDialog.update(state => !state);
  };
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
    background: #212121;
  }
  .sortButton {
    width: 32px;
    color: white;
    text-align: center;
  }
</style>

<footer>
  <IconButton onClick={openGenreDialog}>
    <GuitarIcon fill={$selectedGenres.length > 0 ? '#b2102f' : 'white'} />
  </IconButton>
  <IconButton onClick={() => filterYandex.update(state => !state)}>
    <YandexIcon fill={$filterYandex ? '#b2102f' : 'white'} />
  </IconButton>
  <IconButton onClick={() => filterGoogle.update(state => !state)}>
    <GoogleIcon fill={$filterGoogle ? '#b2102f' : 'white'} />
  </IconButton>
  <div class="sortButton">
    <IconButton onClick={() => sortByAphabet.update(state => !state)}>
      {$sortByAphabet ? 'AZ' : '321'}
    </IconButton>
  </div>
</footer>
