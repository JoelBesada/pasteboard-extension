(function() {
  var SITE_URL = "http://localhost:4000",
      screenshotButton,
      clipboardButton,
      errorContainer;

  function init() {
    screenshotButton = document.getElementById("screenshot");
    clipboardButton = document.getElementById("clipboard");
    errorContainer = document.getElementById("error");

    addListeners();
  }

  function addListeners() {
    screenshotButton.addEventListener("click", captureImage);
    clipboardButton.addEventListener("click", pasteImage);
  }

  function removeListeners() {
    screenshotButton.removeEventListener("click", captureImage);
    clipboardButton.removeEventListener("click", pasteImage);
  }

  // Add a paste listener and force the event on the document
  function pasteImage() {
    removeListeners();
    document.addEventListener("paste", handlePaste);
    document.execCommand("paste");
  }

  // Capture a screenshot of the current tab
  function captureImage() {
    removeListeners();
    chrome.tabs.captureVisibleTab(null, {format: "png"}, insertImage);
  }

  // Handle a paste event. This removes the current
  // event listener since we only want to listen to
  // forced paste events.
  function handlePaste(e) {
    document.removeEventListener("paste", handlePaste);

    var items = e.clipboardData.items;
    if (items) {
      for (var i = 0; i < items.length; i++) {
        var item = items[i];

        // We're only interested in images
        if(/image/.test(item.type))
          return insertImage(item.getAsFile());
      }
    }

    noImageFound();
  }

  // Insert the image into a content script on pasteboard.co
  function insertImage(image) {
    readData(image, function(imageData) {
      openTab(function(tab) {
        insertContentScript(tab, imageData);
      });
    });
  }

  // Read a file as base64 data
  function readData(image, callback) {
    // Call callback with input (asynchronously) if it
    // already is a string (assuming base64)
    if (typeof image === "string")
      return setTimeout(callback.bind(this, image), 1);

    fileReader = new FileReader();
    fileReader.readAsDataURL(image);
    fileReader.onload = function() {
      callback(fileReader.result);
    }
  }

  // Open a tab on pasteboard.co
  function openTab(callback) {
    chrome.tabs.create({url: SITE_URL}, callback);
  }

  // Inject the image data and content script into the page
  function insertContentScript(tab, imageData) {
    chrome.tabs.executeScript(tab.id, {
      code: "window.EXT_IMAGE_DATA = '" + imageData + "';"
    });
    chrome.tabs.executeScript(tab.id, {file: "scripts/content.js"});
  }

  // Display an error in the error container element
  function displayError(text) {
    errorContainer.className = "in";
    errorContainer.textContent = text;
  }

  function noImageFound() {
    addListeners();
    displayError("No image was found in your clipboard.");
  }

  init();
})();