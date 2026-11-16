// Apply the saved motion preference before the first paint so an entrance
// animation never flashes for someone who switched it off.
try {
  if (window.localStorage.getItem("apsis-motion") === "off") {
    document.documentElement.dataset.motion = "off";
  }
} catch {
  // storage may be unavailable; the default is motion on
}
