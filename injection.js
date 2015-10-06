/**
 * Created by Travis on 10/2/2015.
 */
console.log("loaded");
var page = document.documentElement.innerHTML;
if (!window.location.href.match(/ipv4\.google\.com/g)) {
    setTimeout(function () {
        chrome.extension.sendMessage({
                "type": "search_raw_page_result",
                "page": page
            }, function (response) {
                close();
            }
        );
    }, 1000);
    chrome.extension.sendMessage({
        "type": 'captcha_clear'
    });
}
else {
    chrome.extension.sendMessage({
        "type": "captcha",
        "message": window.location.href
    }, null);
    var title = document.title;
    var toggle = true;
    setInterval(function () {
        if (toggle) {
            document.title = "【验证码】" + title;
        } else {
            document.title = title;
        }
        toggle ^= true;
    }, 500);
}