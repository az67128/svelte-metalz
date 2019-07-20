<script>
  import LeftArrowIcon from "../assets/LeftArrowIcon.svelte";
  import RightArrowIcon from "../assets/RightArrowIcon.svelte";
  import { currentMonth } from "../stores/albums";
  import translate from "../utils/translation";
  import IconButton from "./IconButton.svelte";
</script>

<style>
  header {
    padding: 1rem;
    box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12);
    display: flex;
    align-items: center;
  }
  .bar {
    flex-grow: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 1.2rem;
    font-weight: bold;
  }
</style>

<header>

  <div class="bar">
    <IconButton onClick={currentMonth.nextMonth}>
      <LeftArrowIcon />
    </IconButton>
    <div>
      {translate('month')[$currentMonth.getMonth()]}{' '}{$currentMonth.getFullYear()}
    </div>
    <IconButton onClick={currentMonth.prevMonth}>
      <RightArrowIcon />
    </IconButton>
  </div>
</header>
