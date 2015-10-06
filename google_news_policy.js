/**
 * Created by Travis on 10/5/2015.
 */

var GoogleNewsPolicy = Object.create(GooglePolicy);

GoogleNewsPolicy.misc_query_paras = function () {
    return GooglePolicy.misc_query_paras.apply(this) + "&tbm=nws";
};