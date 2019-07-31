<script>
  import IconLink from "../IconLink.svelte";
  import LastFmIcon from "../../assets/LastFmIcon.svelte";
  import GoogleIcon from "../../assets/GoogleIcon.svelte";
  import YandexIcon from "../../assets/YandexIcon.svelte";
  export let listeners = 0;
  export let lastfm_url;
  export let yandex_link;
  export let google_link;
</script>

<style>
  .footer {
    padding: 0.5rem;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
  }
  .lastFmContainer {
    display: flex;
    align-items: center;
  }
  .lastFmContainer div {
    margin-left: 0.5rem;
  }
  .googleLink {
    margin-left: 0.5rem;
  }
</style>

{#if listeners}
  <div class="footer">

    <div class="lastFmContainer">
      <IconLink href={lastfm_url}>
        <LastFmIcon />
      </IconLink>
      <div>{listeners.toLocaleString()}</div>
    </div>

    <div>
      {#if yandex_link}
        <IconLink href={`https://music.yandex.ru/album/${yandex_link}`}>
          <YandexIcon />
        </IconLink>
      {/if}
      {#if google_link}
        <span class="googleLink">
          <IconLink href={`https://play.google.com/music/m/${google_link}`}>
            <GoogleIcon />
          </IconLink>
        </span>
      {/if}

    </div>
  </div>
{/if}
