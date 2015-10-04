/**
 * Created by Travis on 10/2/2015.
 */
console.log("loaded");
var page = document.documentElement.innerHTML;
setTimeout(function () {
    chrome.extension.sendMessage({
            "type": "search_raw_page_result",
            "page": page
        }, function (response) {
            close();
        }
    );
}, 1000);