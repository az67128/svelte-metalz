<script>
  import Header from "./components/Header.svelte";
  import Footer from "./components/Footer.svelte";
  import Main from "./components/Main.svelte";
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
  }
</style>

<Header/>
<Main/>
<Footer/>