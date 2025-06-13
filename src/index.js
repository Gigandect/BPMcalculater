import './style.scss';

// --- 各要素をここで一度取得しておくよ ---
const currentBpmInput = document.getElementById('currentBPM');
const targetBpmInput = document.getElementById('targetBPM');
const resultSpan = document.getElementById('result');
const resultWrapper = document.getElementById('result-wrapper');

// body要素のクラスリストを操作するための変数とイースターエッグ用のクラス名もグローバルに定義
const bodyClassList = document.body.classList;
const easterEggClass = 'easter-egg-active';

// 通常時の表示形式（HTMLと同じデフォルト）を定義しておく
const defaultResultHtml = `<span id="result"><span class="main-value">-</span><span class="decimal-value"></span></span>%`;

// --- 計算と表示を行う関数を定義するよ！ ---
function calculateAndDisplayResult() {
    const currentBpmValue = currentBpmInput ? parseInt(currentBpmInput.value, 10) : NaN;
    const targetBpmValue = targetBpmInput ? parseInt(targetBpmInput.value, 10) : NaN;

    // 現在フォーカスされている要素を取得する
    const activeElement = document.activeElement;

    // まず、両方の入力欄が数値で、かつ空っぽではないかを確認する
    if (!isNaN(currentBpmValue) && !isNaN(targetBpmValue) && currentBpmInput.value !== '' && targetBpmInput.value !== '') {

        // currentBPMとtargetBPMのどちらかでも2桁未満だったら計算しない
        if (currentBpmInput.value.length < 2 || targetBpmInput.value.length < 2) {
            if (resultWrapper) {
                resultWrapper.innerHTML = defaultResultHtml;
                const mainValueSpan = resultWrapper.querySelector('.main-value');
                const decimalValueSpan = resultWrapper.querySelector('.decimal-value');
                if (mainValueSpan && decimalValueSpan) {
                    mainValueSpan.textContent = '-';
                    decimalValueSpan.textContent = '';
                }
            }
            bodyClassList.remove(easterEggClass); // クラス削除
            return; // ここで関数を終了
        }

        // ゼロ除算のチェック
        if (currentBpmValue === 0) {
            if (resultWrapper) {
                resultWrapper.innerHTML = defaultResultHtml;
                const mainValueSpan = resultWrapper.querySelector('.main-value');
                const decimalValueSpan = resultWrapper.querySelector('.decimal-value');
                if (mainValueSpan && decimalValueSpan) {
                    mainValueSpan.textContent = '-';
                    decimalValueSpan.textContent = '';
                }
            }
            bodyClassList.remove(easterEggClass); // クラス削除
            return; // ここで関数を終了
        }

        const rawCalculatedValue = (targetBpmValue - currentBpmValue) / currentBpmValue;
        const formattedValue = (rawCalculatedValue * 100).toFixed(2);

        const mainValueString = formattedValue.split('.')[0];

        // ★★★ここが新しいイースターエッグの発動条件だよ！★★★
        // 入力欄がフォーカスされていない、かつ、main-valueが4桁以上の場合に発動
        if (
            resultWrapper &&
            mainValueString.length >= 4 &&
            activeElement !== currentBpmInput && // currentBpmInputがフォーカスされていない
            activeElement !== targetBpmInput    // targetBpmInputがフォーカスされていない
        ) {
            console.log('FUCK YOU!');
            resultWrapper.textContent = 'FUCK YOU!'; // イースターエッグメッセージに置き換え
            bodyClassList.add(easterEggClass);      // クラス追加
            return; // イースターエッグが発動したら、ここで関数を終了
        }

        // イースターエッグの条件を満たさない場合（通常表示に戻す場合）
        // または入力欄がフォーカスされている場合はここが実行される
        if (resultWrapper) {
            resultWrapper.innerHTML = defaultResultHtml;
            const currentMainValueSpan = resultWrapper.querySelector('.main-value');
            const currentDecimalValueSpan = resultWrapper.querySelector('.decimal-value');

            if (currentMainValueSpan && currentDecimalValueSpan) {
                const parts = formattedValue.split('.');
                currentMainValueSpan.textContent = parts[0];
                if (parts.length > 1) {
                    currentDecimalValueSpan.textContent = '.' + parts[1];
                } else {
                    currentDecimalValueSpan.textContent = '';
                }
            }
        }
        bodyClassList.remove(easterEggClass); // 通常表示に戻るのでクラス削除

    } else {
        // どちらか一方でも数値じゃない、または空欄だったら'-'に戻すよ
        if (resultWrapper) {
            resultWrapper.innerHTML = defaultResultHtml;
            const mainValueSpan = resultWrapper.querySelector('.main-value');
            const decimalValueSpan = resultWrapper.querySelector('.decimal-value');
            if (mainValueSpan && decimalValueSpan) {
                mainValueSpan.textContent = '-';
                decimalValueSpan.textContent = '';
            }
        }
        bodyClassList.remove(easterEggClass); // 無効な状態なのでクラス削除
    }
}

// inputの入力規制とイベントリスナーの設定
const bpmInputs = document.querySelectorAll('.bpm-input');

bpmInputs.forEach(inputElement => {
    inputElement.addEventListener('input', function(event) {
        let value = event.target.value;
        value = value.replace(/[^0-9]/g, '');
        if (value.length > 3) {
            value = value.slice(-3);
        }
        let numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) {
            numValue = 0;
        }
        if (numValue > 999) {
            numValue = 999;
        }
        value = String(numValue);
        event.target.value = value;
        calculateAndDisplayResult();
    });

    inputElement.addEventListener('blur', function(event) {
        let value = event.target.value;
        let numValue = parseInt(value, 10);

        if (isNaN(numValue) || numValue < 0) {
            event.target.value = '0';
        } else if (numValue > 999) {
            event.target.value = '999';
        }
        calculateAndDisplayResult();
    });
});


// --- モーダルウィンドウの制御に関する要素取得とイベントリスナーの追加 ---
const hintButton = document.querySelector('.hint');
const hintContent = document.querySelector('.hint-cont');

if (hintButton && hintContent) {
    // ヒントボタンがクリックされた時の処理
    hintButton.addEventListener('click', (event) => {
        hintContent.classList.toggle('is-active');
        // モーダルのスクロール制御
        document.body.style.overflow = hintContent.classList.contains('is-active') ? 'hidden' : '';

        // このイベントの伝播は停止させる！
        event.stopPropagation();
    });

    // document全体がクリックされた時の処理 (PC用)
    document.addEventListener('click', (event) => {
        // クリックされた場所が hintContent の中、または hintButton の中「ではない」なら
        // かつ hintContent が表示中なら
        if (
            !hintContent.contains(event.target) &&
            !hintButton.contains(event.target) && // hintButton自体がクリックされた場合も閉じない
            hintContent.classList.contains('is-active')
        ) {
            hintContent.classList.remove('is-active'); // クラスを削除して非表示にする
            document.body.style.overflow = ''; // スクロールを元に戻す
        }
    });
    // document全体がタッチ開始された時の処理 (スマホ用)
    document.addEventListener('touchstart', (event) => {
        // タッチ開始された場所が hintContent の中、または hintButton の中「ではない」なら
        // かつ hintContent が表示中なら
        if (
            !hintContent.contains(event.target) &&
            !hintButton.contains(event.target) && // hintButton自体がタッチされた場合も閉じない
            hintContent.classList.contains('is-active')
        ) {
            hintContent.classList.remove('is-active'); // クラスを削除して非表示にする
            document.body.style.overflow = ''; // スクロールを元に戻す
        }
    });

    // モーダルコンテンツ内でのクリックは閉じる動作をさせないための停止
    hintContent.addEventListener('click', (event) => {
        event.stopPropagation();
    });
}

// ページが完全に読み込まれた時にも一度計算を実行しておく (初期表示のため)
document.addEventListener('DOMContentLoaded', calculateAndDisplayResult);


// Service Workerの登録
// ブラウザがService Workerに対応しているかを確認
if ('serviceWorker' in navigator) {
    // ページの読み込みが完了したらService Workerを登録
    window.addEventListener('load', () => {
        // Service Workerファイルのパスを指定して登録
        // ここでのパスは、ドメインのルートからの絶対パスになるように '/service-worker.js' と指定するよ
        navigator.serviceWorker.register('/BPMcalculater/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered! Scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}


// タップ検出用の要素を取得
const tapDetector = document.getElementById('tap-detector');
// BPM入力フィールドを取得
const currentBPMInput = document.getElementById('currentBPM');
const bodyElement = document.body;

// タップのタイムスタンプを保存する配列
let tapTimes = [];
// タップ間隔をリセットするためのタイマーID
let resetTimerId;

// タップ間隔をリセットする関数
function resetTapTempo() {
    tapTimes = []; // 配列を空にする
    if (resetTimerId) {
        clearTimeout(resetTimerId); // 既存のタイマーをクリア
    }
    console.log("Tap tempo reset."); // デバッグ用
}

// タップ（PCではクリック）開始イベントリスナーを追加
tapDetector.addEventListener('touchstart', handleTapStart); // スマホなどのタッチデバイス用
tapDetector.addEventListener('mousedown', handleTapStart);  // PCのマウスダウン用

// タップ（PCではクリック）終了イベントリスナーを追加
tapDetector.addEventListener('touchend', handleTapEnd);     // スマホなどのタッチデバイス用
tapDetector.addEventListener('mouseup', handleTapEnd);      // PCのマウスアップ用
tapDetector.addEventListener('touchcancel', handleTapEnd);  // タップがキャンセルされた場合用

// イベントハンドラを関数として定義する
function handleTapStart(event) {
    // マウスの場合、左クリック（ボタン0）のみ反応するようにする
    if (event.type === 'mousedown' && event.button !== 0) {
        return; // 左クリック以外は無視
    }
    

    // タッチイベントのデフォルト動作（ダブルタップズームなど）を防ぐ
    // 'mousedown' イベントではデフォルト動作をキャンセルしない方がPCでテキスト選択などができるため、
    // touchstart の場合にのみ適用するのがベストプラクティスだよ。
    if (event.type === 'touchstart') {
        event.preventDefault(); 
    }


    // イベントのデフォルト動作を防ぐ（スクロールなど）
    // PCでは問題ないことが多いが、スマホで必要になる場合がある
    // if (event.cancelable) { // イベントがキャンセル可能か確認
    //     event.preventDefault(); 
    // }

    if (resetTimerId) {
        clearTimeout(resetTimerId);
    }

    const currentTime = Date.now();
    tapTimes.push(currentTime);

    console.log("Tap!", tapTimes);

    bodyElement.classList.add('tap-active');

    if (tapTimes.length > 5) {
        tapTimes.shift();
    }

    if (tapTimes.length >= 5) {
        let intervals = [];
        for (let i = 0; i < tapTimes.length - 1; i++) {
            intervals.push(tapTimes[i + 1] - tapTimes[i]);
        }

        const sum = intervals.reduce((a, b) => a + b, 0);
        const averageInterval = sum / intervals.length;
        const detectedBPM = 60000 / averageInterval;

        currentBPMInput.value = Math.round(detectedBPM);
        calculateAndDisplayResult(); // BPMを更新したら結果も計算
    }

    resetTimerId = setTimeout(resetTapTempo, 3000);
}

// タップ終了イベントリスナーを追加
function handleTapEnd(event) {
    // マウスの場合、左クリック（ボタン0）のみ反応するようにする
    if (event.type === 'mouseup' && event.button !== 0) {
        return; // 左クリック以外は無視
    }
    
    bodyElement.classList.remove('tap-active');
}

// 初期化（もし必要なら）
resetTapTempo(); // アプリ起動時に一度リセットしておく