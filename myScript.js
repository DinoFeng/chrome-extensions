function myScript() {
  // Check if jQuery is defined
  if (typeof jQuery === 'undefined') {
    // If not, wait for it to load, then execute myScript()
    setTimeout(myScript, 100)
  } else {
    // jQuery loaded, do your stuff here...
    $(document).ready(function () {
      // Your code...
    })
  }
}

myScript()
