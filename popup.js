// chrome.extension.getBackgroundPage().console.log("Get page content");
// chrome.extension.getBackgroundPage().getTabContent();
// document.getElementById("myBtn").addEventListener("click", function () {
//   alert("Hello World!!!!");
//   chrome.extension.getBackgroundPage().console.log("Get page content");
//   const x = chrome.extension.getBackgroundPage().getTabContent();
//   alert(x);
// });
document.addEventListener("DOMContentLoaded", function () {
  var getPageContentBtn = document.getElementById("get-page-content");
  var pageContentWrapper = document.getElementById("page-content-wrapper");

  getPageContentBtn.addEventListener("click", function () {
    chrome.runtime.sendMessage(
      { action: "get-page-content" },
      function (response) {
        pageContentWrapper.innerText = response;
      }
    );
  });
});
