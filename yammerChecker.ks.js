var PLUGIN_INFO =
        <KeySnailPlugin>
        <name>Yammer Plugin for KeySnail</name>
        <description>view Yammer</description>
        <description lang="ja">Yammer の更新通知と閲覧を補助します</description>
        <updateURL>http://raw.github.com/nishikawasasaki/KeySnail_YammerChecker/master/yammerChecker.ks.js</updateURL>
        <license>The MIT License</license>
        <author homepage="http://nishikawasasaki.hatenablog.com/">nishikawasasaki</author>
        <version>0.2.4.16</version>
        <minVersion>1.0.0</minVersion>
        <include>main</include>
        <provides>
        <ext>yammer-chehk-toggle</ext>
        <ext>one-check-yammer</ext>
        <ext>view-yammer</ext>
        </provides>
    <detail><![CDATA[
            === 使い方 ===
            起動すると自動的に更新確認を開始します。
        更新があった場合は通知を表示します。
    ]]></detail>
    </KeySnailPlugin>;

const pOptions = plugins.setupOptions("yammerplugin", {
    "update_interval" : {
        preset: 180,
        description: M({
            en: "Update interbal seconds (default 60 seconds)",
            ja: "新着確認間隔秒 (デフォルトは 180秒)"
        }),
        type: "number"
    }
}, PLUGIN_INFO);

// 処理のオンオフトグル
var status = true;
// API
var feed_api_url = "https://www.yammer.com/api/v1/messages/my_feed.json";
var user_api_url = "https://www.yammer.com/api/v1/users/";
// 新着確認間隔
var interval = pOptions["update_interval"] * 1000;
// 取得した新着メッセージと比較するための前回メッセージの ID
var lastPostId = 0;

var users = {};

function httpGet(url) {
    var xmlHttp = null;

    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", url, false );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}


// オンの場合には処理開始
function main() {
    if (status) {
        yammerUpdateCheck();
    } else {
    }

    setTimeout(main, interval);

}

// 起動時に開始
main();


// 更新確認と通知を行う
function yammerUpdateCheck() {

    var str = httpGet(feed_api_url);
    var jsObject = JSON.parse(str);

    if(jsObject.messages[0].id != lastPostId) {

        var bodyMsg = jsObject.messages[0].body.parsed;
        var senderInfo = getSenderInfo(jsObject, jsObject.messages[0].sender_id);
        var senderName = senderInfo[0];

        lastPostId = jsObject.messages[0].id;

        display.showPopup("yammer checker", senderName + "\n" + bodyMsg);

    }
}


// ID から投稿者情報を取得
function getSenderInfo(jsObject, id) {

    // var apiUrl = user_api_url + id + ".json";
    // var str = httpGet(apiUrl);
    // var jsObject = JSON.parse(str);

    var senderName = "";
    var senderImageUrl = "";

    if (users[id] != null) {

        senderName = users[id][0];
        senderImageUrl = users[id][1];

    } else {

 
        var refLength = jsObject.references.length;
        var elem = null;

        for (var i = 0; i < refLength; i++) {

            elem = jsObject.references[i];

            if (elem.type == "user") {

                if (elem.id == id) {
                    senderName = elem.full_name;
                    senderImageUrl = elem.mugshot_url;

                    setUserInfo(id, senderName, senderImageUrl);
                }
            
            }
        
        }

    }

    return [senderName, senderImageUrl];

}

function setUserInfo(id, name, imgUrl) {
    users[id] = [name, imgUrl];
}


function viewYammer() {

    var str = httpGet(feed_api_url);
    var jsObject = JSON.parse(str);    

    var count = 0;
    var posts = [];
    var length = jsObject.messages.length;
    var element = null;
    for (var i = 0; i < 10; i++) {
        element = jsObject.messages[i];
        var senderInfo = getSenderInfo(jsObject, element.sender_id);
        var date = new Date(element.created_at);
        posts.push([senderInfo[1], senderInfo[0], element.body.parsed, date.toLocaleString(), element.web_url]);
    }

    prompt.selector({

        message: "pattern:",
        collection: posts,
        flags: [ICON | IGNORE, 0, 0, 0, HIDDEN | IGNORE],
        style: [null, null, "color:#666666;"],
        header: ["Name", "Comment", "Date"],
        width: [20, 65, 15],
        actions: [
            [function (idx, elem) {
                if (idx >= 0) {
                    openUILinkIn(elem[idx][4], "tab");
                }
            },
             'Open']
        ]
    });
}



ext.add("yammer-chehk-toggle", function () {
    status = !status;
    display.echoStatusBar(
        M({ja: ("yammer の更新確認を" + (status ? "開始しました" : "停止しました")),
           en: ("check yammer " + (status ? "enabled" : "disabled"))}), 2000);
}, L("yammer 更新確認 ON / OFF を切り替え"));

ext.add("one-check-yammer", function () {
    yammerUpdateCheck();
}, L("最新投稿を通知に1回だけ確認(更新が無い場合は表示されません)"));

ext.add("view-yammer", function () {
    viewYammer();
}, L("yammer を見る"));