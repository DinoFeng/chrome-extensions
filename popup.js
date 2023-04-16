// chrome.extension.getBackgroundPage().console.log("Get page content");
// chrome.extension.getBackgroundPage().getTabContent();
// document.getElementById("myBtn").addEventListener("click", function () {
//   alert("Hello World!!!!");
//   chrome.extension.getBackgroundPage().console.log("Get page content");
//   const x = chrome.extension.getBackgroundPage().getTabContent();
//   alert(x);
// });

document.addEventListener('DOMContentLoaded', function () {
  const getPageContentBtn = document.getElementById('get-page-content')
  const pageContentWrapper = document.getElementById('page-content-wrapper')
  const contentInput = document.getElementById('content-selector')
  const nextchapterInput = document.getElementById('next-chapter-selector')

  getPageContentBtn.addEventListener('click', function () {
    const content = contentInput.value || undefined
    const next_chapter = nextchapterInput.value || undefined
    chrome.runtime.sendMessage(
      {
        action: 'get-page-content',
        options: {
          seletor: {
            content,
            next_chapter,
          },
        },
      },
      function (response) {
        pageContentWrapper.innerText = response
      }
    )
  })
})
