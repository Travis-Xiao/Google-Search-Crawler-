/**
 * Created by Travis on 10/1/2015.
 */

var search_url_tab_id = -1;
var exhibition_tab_id;
var exhibition_port;
var curr_search_index;
var search_history = new Set();
var transition_page = "http://www.google.co.jp/";
var current_search_url = "";
var is_notification_on = false;

function create_search_url_tab(search_url, callback) {
    chrome.tabs.create({url: transition_page}, function (tab) {
        search_url_tab_id = tab.id;
        chrome.tabs.executeScript(tab.id, {
            file: "injection.js"
        }, null);
        if (search_url) {
            update_search_url_tab(tab_id, search_url);
        }
    });
}
function update_search_url_tab(tab_id, url) {
    chrome.tabs.update(tab_id, {url: url});
}
function notify_exhibition_start() {
    exhibition_port.postMessage({message: "start"});
}
chrome.runtime.onConnect.addListener(function (port) {
    if (port.name == "search") {
        exhibition_port = port;
        notify_exhibition_start();
        port.onMessage.addListener(function (message) {
            curr_search_index = message.search_index;
            if (message.action == 'init') {
                create_search_url_tab(null);
            } else if (message.action == 'subsequent') {
                var url = message.search_url;
                current_search_url = url;
                if (search_history.contains(url)) {
                    return;
                }
                console.log("search:\t" + message.search_url);
                search_history.add(message.search_url);
                update_search_url_tab(search_url_tab_id, message.search_url);
            } else if (message.action == 'close') {
                chrome.tabs.sendMessage(search_url_tab_id, {});
            }
        });
    }
});
function audion_notification() {
    var alert_sound = new Audio('sounds/notification.wav');
    alert_sound.play();
}
function create_notification(message) {
    if (is_notification_on) return;
    is_notification_on = true;
    var opt = {type: "basic", title: "Captcha!!!", message: message || "Captcha", iconUrl: "icon.png"};
    chrome.notifications.create("alert", opt, function () {
    });
    setTimeout(clear_notification, 15000);
}
function clear_notification() {
    chrome.notifications.clear("alert", function () {
    });
    is_notification_on = false;
}
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request.type);
    if (request == undefined) return;
    if (request.type == 'start_exhibition') {
        chrome.tabs.create({url: chrome.extension.getURL('result_exhibition.html')}, function (tab) {
            exhibition_tab_id = tab.id;
        });
    }
    else if (request.type == 'search_raw_page_result') {
        exhibition_port.postMessage({
            "message": "search_result",
            'page': request.page,
            'search_index': curr_search_index,
            "url": current_search_url
        });
    }
    else if (request.type == 'captcha') {
        create_notification();
        audion_notification(request.message);
    }
    else if (request.type == 'captcha_clear') {
        clear_notification();
    }
});
chrome.omnibox.onInputEntered.addListener(function (text) {
    console.log("query_from_omnibox(" + text + ")");
    //chrome.tabs.create({url: chrome.extension.getURL('result_exhibition.html')}, function (tab) {
    //    exhibition_tab_id = tab.id;
    //    chrome.tabs.executeScript(tab.id, {
    //        code: "query_from_omnibox("+ text + ")"
    //    }, function (data) {
    //        console.log(data);
    //    });
    //});
});