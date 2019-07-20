<script>
  import { spiritOfMetalUrl } from "../../config";
  import { coverPreviewSrc } from "../../stores/albums";
  export let cover_url;
  export let title;
  export let author;
  export let genre;
  let src = `${spiritOfMetalUrl}${cover_url}`;
  const viewCover = () => {
    coverPreviewSrc.set(src);
  };
</script>

<style>
  .content {
    display: flex;
  }

  .albumInfo {
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    flex-flow: 1;
  }
  .cover {
    margin: 0.5rem;
    width: 88px;
    height: 88px;
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12);
    background: rgba(0, 0, 0, 0.5);
  }
  .cover img {
    width: 88px;
    height: 88px;
  }
  .albumTitle {
    font-size: 1.2rem;
    font-weight: bold;
    flex-grow: 1;
  }
</style>

<div class="content">
  <div class="cover" on:click={viewCover}>
    <img
      {src}
      alt="album-cover"
      on:error={() => (src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=')} />
  </div>
  <div class="albumInfo">
    <div class="albumTitle">{author}</div>
    <div>{title}</div>
    <div>{genre}</div>
  </div>
</div>
