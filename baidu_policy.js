/**
 * Created by Travis on 10/3/2015.
 */

var BaiduPolicy = function () {
    this.search_engine_base = "http://www.baidu.com/s?";
    this.record_per_page = 50;
    this.max_record_per_query = 1000;
    this.query_name = "wd";
    this.misc_query_paras = "ie=utf-8"
        + "&f=8"
        + "&tn=baidulocal"
        + "&rn=" + this.record_per_page
        + "&rsv_spt=1"
        + "&inputT=500"
        + "&cl=3";
    this.max_page_count = Math.ceil(this.max_record_per_query * 1.0 / this.record_per_page);
};
BaiduPolicy.prototype = {
    parse_raw_url : function (url) {
        return url;
    },
    start_from : function (page) {
        return "pn=" + Math.max(0, page) * this.record_per_page;
    },
    is_valid_url : function (url) {
        if (!url) return false;
        var skip_patterns = [
            /cache\.baidu\.com/g
        ];
        for (var key in skip_patterns) {
            var pattern = skip_patterns[key];
            if (url.match(pattern)) return false;
        }
        return true;
    },
    convert_datetime_range : function(start_date) {
        function format(date) {
            return date - 0;
        }
        end_date = new Date(start_date - (- 24 * 60 * 60 * 1000));
        return "gpc:stf=" + format(start_date) + "," + format(end_date)
            + "|stftype=2";
    },
    extract_valid_entry : function (page) {
        return two_stage_url_extractor(["td.f", "a"], page, BaiduPolicy.prototype.is_valid_url, BaiduPolicy.prototype.parse_raw_url);
    }
};
