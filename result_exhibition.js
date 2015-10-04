/**
 * Created by Travis on 10/2/2015.
 */

var day_length = 24 * 60 * 60 * 1000;
var time_points = [];
var start_date;
var policy, queries, keywords, total_links;
var curr_time_point_result_count;
var port;
var query_sequence;
var last_page_content = "";
var record_sequence;

var query_status_area, status_board, result_area, result_count_area,
    tld_progress, tp_progress, page_progress,
    start_time;

function prepare_query (policy, keywords, tlds) {
    var query_base = policy.query_name + "=" + keywords.join("+");
    queries = [policy.query_name + "=", query_base];
    for (var key in tlds.slice(0, 5))
        queries.push(query_base + encodeURIComponent(" site:*" + tlds[key]));
    return queries;
}
function log_status(type, data) {
    switch (type) {
        case "status":
            status_board.text(data);
            break;
        case "result":
            var item = $("<li>");
            item.addClass("list-group-item");
            item.text(data);
            result_area.prepend(item);
            //if
            break;
        case "update":
            var progress = data['progress'];
            tld_progress.text(progress['query']['curr'] + " / " + progress['query']['total']);
            tp_progress.text(progress['time_point']['curr'] + " / " + progress['time_point']['total']);
            page_progress.text(progress['page']['curr'] + " / " + progress['page']['total']);
            result_count_area.text(data['result']['total_result']);

            var result = data["result"];
            var matches = result["search_url"].match(/wd=.+&pn=[0-9]+&/g);
            var url = matches ? matches[0] : "--";
            var record = $("<tr><th scope='row'>" + record_sequence + "</th>"
                + "<td>" + (new Date()).toLocaleTimeString().split(" ")[0] + "</td>"
                + "<td>" + url + "</td>"
                + "<td>" + result["link_count"] + "</td>"
                + "<td>" + result["new_link_count"] + "</td>"
                + "<td>" + (data['error']['count'] || "--") + "</td>"
                + "</tr>");
            query_status_area.prepend(record);
            record_sequence ++;
            break;
        default :
            break;
    }
    //var line = $("<li>");
    //line.text(status);
    //status_area.children().first().prepend(line);
}
function start_query (query) {
    // generate time points
    start_date = new Date();
    var cur_date = start_date;
    var earliest_date_point = new Date(start_date - 1200 * day_length);
    while (earliest_date_point < cur_date)
        time_points.push(cur_date = new Date(cur_date - day_length));
    policy = new BaiduPolicy();
    keywords = query.split(" ");
    queries = prepare_query(policy, keywords, tlds);
    total_links = new Set();
    curr_time_point_result_count = 0;

    // initiate long lived connection with background.js
    port = chrome.runtime.connect({
        name: "search"
    });
    port.onMessage.addListener(function (message) {
        if (message && message.message == "start") {
            log_status("status", "Connect");
            recursive_query({
                'q': 0,
                'time_point': 0,
                'page': 0
            }, "init");
        } else if (message && message.message == 'search_result') {
            process_page(message);
        }
    });
}
function get_next_index_page(old_index) {
    var next_index;
    if (old_index['page'] == policy.max_page_count - 1) {
        next_index = get_next_index_time_point(old_index);
        next_index['page'] = 0;
    } else {
        next_index = jQuery.extend(true, {}, old_index);
        next_index['page'] += 1;
    }
    return next_index;
}
function get_next_index_time_point(old_index, force_reset) {
    curr_time_point_result_count = 0;
    var next_index;
    if (old_index['time_point'] == time_points.length - 1) {
        next_index = get_next_index_query(old_index);
        next_index['time_point'] = 0;
    } else {
        next_index = jQuery.extend(true, {}, old_index);
        next_index['time_point'] += 1;
    }
    if (force_reset) {
        next_index['page'] = 0;
    }
    return next_index;
}
function get_next_index_query(old_index, force_reset) {
    var next_index;
    if (old_index['q'] == time_points.length - 1) {
        return;
    } else {
        next_index = jQuery.extend(true, {}, old_index);
        next_index['q'] += 1;
        if (force_reset) {
            next_index['time_point'] = 0;
            next_index['page'] = 0;
        }
    }
    return next_index;
}
// handle response
function process_page(response) {
    if (response == undefined) return;
    // get results from response
    var search_index = response.search_index;
    log_status("status", "Handle Response");
    var next_index = get_next_index_page(search_index);
    var page = response.page;
    var url = response.url;
    var extraction_res = policy.extract_valid_entry(page);
    var links = extraction_res["entry"];
    var errors = extraction_res["error"];
    // print errors
    if (errors["count"] != 0) {
        var error_index = 0;
        for (var err in errors["messages"]) {
            //log_status("err", "ERROR " + error_index + "\t" + err);
            error_index ++;
        }
    }
    // update link records
    var prev_link_count = total_links.size();
    curr_time_point_result_count += links.length;
    total_links.merge(links);
    //for (var link in links) total_links.add(link);
    var curr_link_count = total_links.size();
    // log links
    for (var i = 0; i < links.length; i ++)
        log_status("result", i + ":\t" + links[i]);
    var msg = "{0}: {1}/{2}\t{3}/{4}\t{5}/{6}: {7}/{8}"
        .format(new Date(), search_index['q'], queries.length,
        search_index['time_point'], time_points.length, search_index['page'], policy.max_page_count,
        curr_link_count - prev_link_count, links.length
    );
    log_status("update", {
        "progress": {
            "page": {
                "total": policy.max_page_count,
                "curr": search_index['page']
            },
            "time_point": {
                "total": time_points.length,
                "curr": search_index['time_point']
            },
            "query": {
                "total": queries.length,
                "curr": search_index['q']
            }
        },
        "result": {
            "total_result": total_links.size(),
            "search_url": url,
            "link_count": links.length,
            "new_link_count": curr_link_count - prev_link_count
        },
        "error": {
            "count": error_index
        }
    });
    //if (page == last_page_content) {
    //    next_index = get_next_index_query(search_index, true);
    //}
    //else
    if (curr_time_point_result_count == 0) {
        next_index = get_next_index_query(search_index, true);
    }
    else if (links.length == 0 || links.length + errors['count'] < policy.record_per_page) { // indicates the last page
        next_index = get_next_index_time_point(search_index);
    }
    last_page_content = page;
    recursive_query(next_index, "subsequent");
}
// request another query
function recursive_query (search_index, action_type) {
    if (search_index == undefined) {
        // end of the whole query
        log_status("status", "The End");
        return;
    }
    log_status("status", "Start Query: " + query_sequence);
    query_sequence ++;
    var q = queries[search_index['q']],
        point = time_points[search_index['time_point']],
        k = search_index['page'];
    var search_paras = [
        policy.start_from(k),
        policy.convert_datetime_range(point),
        policy.misc_query_paras
    ];
    var search_url = policy.search_engine_base + q + "&" + search_paras.join("&");
    port.postMessage({
        "search_url": search_url,
        "search_index": search_index,
        "action": action_type,
        callback: process_page
    });
}
function clear() {
    result_area.children().remove();
    query_status_area.children().remove();
    query_sequence = 0;
    record_sequence = 0;
}
function view_component_init() {
    query_status_area = $("#query-status-area");
    status_board = $("#status>b");
    result_area = $("#result-area");
    start_time = $("#starttime");
    tld_progress = $("#tld-progress");
    tp_progress = $("#time-point-progress");
    page_progress = $("#page-progress");
    result_count_area = $("#result-count");
    clear();
}
document.addEventListener('DOMContentLoaded', function() {
    view_component_init();
    var search_box = $("#keywords");
    var search_btn = $("#commit-search");
    search_box.on('keypress', function(e) {
        if (e.keyCode == 13) start_query($(this).val());
    });
    search_btn.on('click', function(e) {
        clear();
        start_query(search_box.val());
    });
    search_box.val("hello mers");
    search_box.focus();
});