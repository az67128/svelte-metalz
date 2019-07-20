<script>
  import Content from "./Content.svelte";
  import Footer from "./Footer.svelte";
  export let album = {};
  const {
    cover_url,
    title,
    author,
    genre,
    listeners,
    lastfm_url,
    yandex_link,
    google_link
  } = album;
</script>

<style>
  .album {
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12);
    margin: 0.5rem;
    border-radius: 8px;
    background: #fff;
  }
  @media (min-width: 600px) {
    .album {
      flex-grow: 1;

      width: 45%;
    }
  }
  @media (min-width: 1200px) {
    .album {
      flex-grow: 1;

      width: 30%;
    }
  }
  @media (min-width: 1400px) {
    .album {
      flex-grow: 1;

      width: 20%;
    }
  }
</style>

<div class="album">
  <Content {cover_url} {title} {author} {genre} />
  <Footer {listeners} {lastfm_url} {yandex_link} {google_link} />
</div>
