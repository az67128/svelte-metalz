<script>
  import Header from "./components/Header.svelte";
  import Footer from "./components/Footer.svelte";
  import Main from "./components/Main.svelte";
  import CoverPreview from "./components/CoverPreview.svelte";
  import GenreDialog from "./components/GenreDialog.svelte";
</script>

<style>
  :global(html) {
    height: 100%;
  }
  :global(body) {
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    background: #f5f5f5;
  }
</style>

<Header />
<Main />
<GenreDialog />
<CoverPreview />
<Footer />
