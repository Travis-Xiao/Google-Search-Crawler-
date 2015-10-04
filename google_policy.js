/**
 * Created by Travis on 10/2/2015.
 */

var GooglePolicy = function () {
    this.search_engine_base = "https://www.google.com.hk/search?";
    this.record_per_page = 100;
    this.max_record_per_query = 1000;
    this.query_name = "q";
    this.misc_query_paras = "lr=lang_en"
    "&hl=en"
    "&num=" + this.record_per_page
    "&filter=1"
    "&save=active";
    this.max_page_count = Math.ceil(this.max_record_per_query * 1.0 / this.record_per_page);
};

GooglePolicy.prototype = {
    parse_raw_url : function (url) {
        return get_para_from_url(url, 'q');
    },
    start_from : function(page) {
        return "start=" + Math.max(0, page) * this.record_per_page;
    },
    convert_datetime_range : function(start_date) {
        function format(date) {
            return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
        }
        end_date = new Date(start_date - (- 24 * 60 * 60 * 1000));
        return "tbs=cdr:1,cd_min:" + format(start_date) + ",cd_max:" + format(end_date);
    },
    extract_valid_entry : function (page) {
        return two_stage_url_extractor(['.g', 'div.rc>h3.r>a'], page, identity, GooglePolicy.prototype.parse_raw_url);
    }
};