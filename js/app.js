// localStorage のキー
const STORAGE_KEY = "classmates";

// 当時の写真ID → 画像パス
const OLD_PHOTO_MAP = {
    "1": "/img/boy1.jpg",
    "2": "/img/girl1.jpg",
    "3": "/img/boy2.jpg",
    "4": "/img/girl2.jpg",
    "5": "/img/girl3.jpg",
    "6": "/img/boy3.jpg",
};

// 初期表示
$(function () {
    // $("#section-input").slideDown(400);

    // タブ切り替え
    $("#btn-input").on("click", function () {
        $(".tab-buttons button").removeClass("active");
        $(this).addClass("active");
        // $(".tab-buttons").addClass("top");
        $("#section-search").slideUp(300);
        $("#section-input").slideDown(300);
    });

    $("#btn-search").on("click", function () {
        $(".tab-buttons button").removeClass("active");
        $(this).addClass("active");
        // $(".tab-buttons").addClass("top");
        $("#section-input").slideUp(300);
        $("#section-search").slideDown(300);
    });

    // 当時の写真クリックで選択
    $(".old-photo").on("click", function () {

        // すべての選択状態を解除
        $(".old-photo").removeClass("selected");

        // クリックした写真を選択状態に
        $(this).addClass("selected");

        // 選択したIDを取得
        const id = $(this).data("id");

        // プレビュー表示
        $("#oldPhotoPreview")
            .attr("src", $(this).attr("src"))
            .show();

        // detailArea を表示
        $("#detailArea").slideDown(300);

        // 保存時に使うため、選択IDを保持
        $("#detailArea").data("selected-id", id);

        // 既存データがあれば読み込む
        const classmates = loadClassmates();
        const person = classmates.find(p => p.id === id);

        if (person) {
            // 名前とニックネームをセット
            $("#nameInput").val(person.name);
            $("#nicknameInput").val(person.nickname);

            // 現在の写真プレビューをセット
            $("#currentPhotoPreview")
                .attr("src", person.currentPhoto)
                .show();

            // ファイル入力はクリア（セキュリティ上、値をセットできない）
            $("#currentPhotoInput").val("");

            //編集モードでは「現在の写真を変更する」ボタンを表示
            $("#changeCurrentPhotoBtn").show();

        } else {
            // ★ 新規登録の場合は空にする
            $("#nameInput").val("");
            $("#nicknameInput").val("");
            $("#currentPhotoPreview")
                .attr("src", "")
                .hide();
            $("#currentPhotoInput").val("");

            // ★ 新規登録ではボタンを隠す
            $("#changeCurrentPhotoBtn").hide();
        }
    });

    // ★ 当時の写真の選択解除
    $("#clearOldPhotoBtn").on("click", function () {

        // すべての選択状態を解除
        $(".old-photo").removeClass("selected");

        // プレビューを非表示
        $("#oldPhotoPreview")
            .attr("src", "")
            .hide();

        // ★ detailArea の入力内容をリセット
        $("#nameInput").val("");
        $("#nicknameInput").val("");
        $("#currentPhotoInput").val(""); // ファイル入力を空にする
        $("#currentPhotoPreview")
            .attr("src", "")
            .hide(); // 現在の写真プレビューも消す

        // detailArea を閉じる
        $("#detailArea").slideUp(300);

        // 保存用の selected-id を削除
        $("#detailArea").removeData("selected-id");

    });


    // 現在の写真プレビュー
    $("#currentPhotoInput").on("change", function (e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (ev) {
            $("#currentPhotoPreview")
                .attr("src", ev.target.result)
                .show();
        };
        reader.readAsDataURL(file);
    });

    // 保存ボタン
    $("#saveBtn").on("click", function () {
        const id = $("#detailArea").data("selected-id");
        const name = $("#nameInput").val().trim();
        const nickname = $("#nicknameInput").val().trim();
        const oldPhoto = $("#oldPhotoPreview").attr("src");
        const currentPhotoSrc = $("#currentPhotoPreview").attr("src");

        // 写真が選択されていない場合
        if (!id) {
            alert("当時の写真を選択してください。");
            return;
        }

        if (!name || !nickname) {
            alert("名前とニックネームは必須です。");
            return;
        }
        if (!currentPhotoSrc) {
            alert("現在の写真をアップロードしてください。");
            return;
        }

        let classmates = loadClassmates();

        const index = classmates.findIndex(p => p.id === id);
        const newData = {
            id,
            name,
            nickname,
            oldPhoto,
            currentPhoto: currentPhotoSrc
        };

        if (index >= 0) {
            classmates[index] = newData;
        } else {
            classmates.push(newData);
        }

        saveClassmates(classmates);
        alert("保存しました！");

        // ★ 保存後に入力内容と選択状態をすべてクリア
        $(".old-photo").removeClass("selected"); // 当時の写真の選択解除

        $("#oldPhotoPreview")
            .attr("src", "")
            .hide(); // 当時の写真プレビュー非表示

        $("#nameInput").val(""); // 名前クリア
        $("#nicknameInput").val(""); // ニックネームクリア

        $("#currentPhotoInput").val(""); // 現在の写真ファイル入力クリア
        $("#currentPhotoPreview")
            .attr("src", "")
            .hide(); // 現在の写真プレビュー非表示

        $("#detailArea").slideUp(300); // detailArea を閉じる

        $("#detailArea").removeData("selected-id"); // 保存用IDをクリア
    });

    // ★ 現在の写真を変更するボタン
    $("#changeCurrentPhotoBtn").on("click", function () {
        $("#currentPhotoInput").click(); // ファイル選択ダイアログを開く
    });

    // 検索用：当時の写真クリックで選択
    $(".search-old-photo").on("click", function () {

        // すべての選択状態を解除
        $(".search-old-photo").removeClass("selected");

        // クリックした写真を選択状態に
        $(this).addClass("selected");

        // 選択したIDを保持
        const id = $(this).data("id");
        $("#searchOldPhotoList").data("selected-id", id);
    });

    // 検索用：選択解除
    $("#clearSearchOldPhotoBtn").on("click", function () {
        $(".search-old-photo").removeClass("selected");
        $("#searchOldPhotoList").removeData("selected-id");
    });


    // 検索
    $("#searchBtn").on("click", function () {

        // ★ 写真クリックで選択された ID を取得
        const searchId = $("#searchOldPhotoList").data("selected-id");

        const searchName = $("#searchNameInput").val().trim();
        const searchNickname = $("#searchNicknameInput").val().trim();

        const classmates = loadClassmates();

        // ★ find → filter に変更（複数件ヒット対応）
        const results = classmates.filter(p => {
            let ok = true;

            // ★ ID は完全一致
            if (searchId) ok = ok && (p.id === searchId);

            // ★ 名前は部分一致（includes）
            if (searchName) ok = ok && p.name.includes(searchName);

            // ★ ニックネームも部分一致
            if (searchNickname) ok = ok && p.nickname.includes(searchNickname);

            return ok;
        });

        renderSearchResults(results);
    });

    // 検索条件クリア
    $("#clearSearchBtn").on("click", function () {
        $("#searchOldPhotoSelect").val("");
        $("#searchNameInput").val("");
        $("#searchNicknameInput").val("");
        $("#searchResult").empty();
    });
});

// localStorage 読み込み
function loadClassmates() {
    const json = localStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    try {
        return JSON.parse(json);
    } catch (e) {
        return [];
    }
}

// localStorage 保存
function saveClassmates(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}


// 検索結果表示
function renderSearchResults(results) {
    const $result = $("#searchResult");
    $result.empty();

    if (!results || results.length === 0) {
        $result.html("<p>該当する同窓生が見つかりませんでした。</p>");
        return;
    }

    // ★ 複数件をループで描画
    results.forEach(person => {
        const html = `
            <div class="result-card">
                <div class="photos">
                    <div>
                        <div style="font-size:12px;">当時の写真</div>
                        <img src="${person.oldPhoto}">
                    </div>
                    <div>
                        <div style="font-size:12px;">現在の写真</div>
                        <img src="${person.currentPhoto}">
                    </div>
                </div>
                <div class="info">
                    <p><strong>名前：</strong>${person.name}</p>
                    <p><strong>ニックネーム：</strong>${person.nickname}</p>
                    <p><strong>ID：</strong>${person.id}</p>
                </div>
            </div>
        `;
        $result.append(html);
    });
}