/**
 * Created by Travis on 10/2/2015.
 */

var GooglePolicy = {
    record_per_page: 100,
    max_record_per_query: 1000,
    query_name: "q",
    search_engine_base: "https://www.google.co.jp/search?",
    misc_query_paras: function () {
        return "lr=lang_en" +
            "&hl=en" +
            "&num=" + GooglePolicy.record_per_page +
            "&filter=1" +
            "&save=active" +
            "&aqs=chrome..69i57j69i60j5j69i60.331j0j7" +
            "&sourceid=chrome";
    },
    max_page_count: function () {
        return Math.ceil(GooglePolicy.max_record_per_query / GooglePolicy.record_per_page)
    },
    parse_raw_url: function (url) {
        return get_para_from_url(url, 'q');
    },
    start_from: function (page) {
        return "start=" + Math.max(0, page) * GooglePolicy.record_per_page;
    },
    convert_datetime_range: function (start_date) {
        function format(date) {
            if (GooglePolicy.search_engine_base.match(/google\.co\.jp/g))
                return (date.getMonth() + 1) + "/" + date.getDate() + "/" + date.getFullYear();
            else
                return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
        }

        //end_date = new Date(start_date - (- 24 * 60 * 60 * 1000));
        var time_str = format(start_date);
        return "tbs=cdr:1,cd_min:" + time_str + ",cd_max:" + time_str;
    },
    extract_valid_entry: function (page) {
        return two_stage_url_extractor(['.g', 'div.rc>h3.r>a'], page, identity, GooglePolicy.parse_raw_url);
    }
};
