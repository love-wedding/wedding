function autoScroll(scrollY, speed) {
  let getUrl = window.location.search;
  if (getUrl.includes("scroll=true")) {
    setInterval(() => {
      window.scrollBy(0, scrollY);
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
        window.scrollTo(0, 0);
      }
    }, speed);
  }
}
