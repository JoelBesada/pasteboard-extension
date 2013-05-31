(function() {
  // Read the data from the script tag
  var script = document.getElementById("ext-injected-script");
  var imageData = script.getAttribute("data-image");
  script.setAttribute("data-image", "");

  // Trigger an event for the page application code to handle
  $(window).trigger("extensionimageloaded", { imageData: imageData });
})()