/**
 * Created by Travis on 10/2/2015.
 */

function get_para_from_url(url, para) {
    // TODO
    return url;
}
var Set = function () {
    this.length = 0;
    this.elements = [];
    this.add = function (elem) {
        if (!this.contains(elem)) {
            this.length ++;
            this.elements.push(elem);
        }
    };
    this.merge = function (list) {
        for (var e in list) {
            this.add(e);
        }
    };
    this.size = function () {
        return this.length;
    };
    this.contains = function (elem) {
        return this.elements.indexOf(elem) != -1;
    };
};

if (!String.prototype.format) {
    String.prototype.format = function() {
        var args = arguments;
        return this.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] != 'undefined'
                ? args[number]
                : match
                ;
        });
    };
}
function identity(o) {return o};
function two_stage_url_extractor(selectors, page, valid_url_filter, parse_url) {
    var wrappers = $(selectors[0], page);
    var entries = [];
    var error_count = 0;
    var error_messages = [];
    for (var i = 0; i < wrappers.length; i ++) {
        var wrapper = wrappers[i];
        try {
            var raw_link = $(selectors[1], wrapper).attr("href");
            if (valid_url_filter(raw_link))
                entries.push(parse_url(raw_link));
        } catch (e) {
            error_messages.push(e.message);
            error_count += 1;
        }
    }
    return {
        "entry": entries,
        "error": {
            "count": error_count,
            "messages": error_messages
        }
    }
}