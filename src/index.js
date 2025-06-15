import './style.scss';

// --- DOM要素の取得 ---
// アプリ全体で使う要素を一度だけ取得しておくよ
const currentBpmInput = document.getElementById('currentBPM');
const targetBpmInput = document.getElementById('targetBPM');
const resultWrapper = document.getElementById('result-wrapper');
const tapDetector = document.getElementById('tap-detector');
const bodyElement = document.body;

//ボタン要素
const currentBpmControls = document.querySelector('.bpm-controls[data-target="currentBPM"]');
const targetBpmControls = document.querySelector('.bpm-controls[data-target="targetBPM"]');


// UIの状態管理に使う定数や変数
const easterEggClass = 'easter-egg-active';
// RESULTの初期表示形式をHTMLとして定義
const defaultResultHtml = `<span id="result"><span class="main-value">-</span><span class="decimal-value"></span></span>%`;

// タップテンポ検出用の変数
let tapTimes = []; // タップのタイムスタンプを保存
let resetTimerId;  // タップ間隔をリセットするタイマーのID

// --- 計算と結果表示のロジック ---
function calculateAndDisplayResult() {
    const currentBpmValue = currentBpmInput ? parseInt(currentBpmInput.value, 10) : NaN;
    const targetBpmValue = targetBpmInput ? parseInt(targetBpmInput.value, 10) : NaN;
    const activeElement = document.activeElement; // 現在フォーカスされている要素


    // BPMコントロールボタンの表示/非表示を更新する
    // currentBPMに数値が入っていれば表示、そうでなければ非表示
    if (!isNaN(currentBpmValue) && currentBpmInput.value !== '') {
        currentBpmControls.classList.add('is-active');
    } else {
        currentBpmControls.classList.remove('is-active');
    }
    // targetBPMに数値が入っていれば表示、そうでなければ非表示
    if (!isNaN(targetBpmValue) && targetBpmInput.value !== '') {
        targetBpmControls.classList.add('is-active');
    } else {
        targetBpmControls.classList.remove('is-active');
    }

    // 両方の入力欄が数値で、かつ空でないことを確認
    if (!isNaN(currentBpmValue) && !isNaN(targetBpmValue) && currentBpmInput.value !== '' && targetBpmInput.value !== '') {
        // 2桁未満のBPMは計算しない（初期表示に戻す）
        if (currentBpmInput.value.length < 2 || targetBpmInput.value.length < 2) {
            resetResultDisplay();
            return;
        }

        // ゼロ除算のチェック（currentBPMが0の場合は計算しない）
        if (currentBpmValue === 0) {
            resetResultDisplay();
            return;
        }

        // ピッチのパーセンテージを計算し、小数点以下2桁にフォーマット
        const rawCalculatedValue = (targetBpmValue - currentBpmValue) / currentBpmValue;
        const formattedValue = (rawCalculatedValue * 100).toFixed(2);
        const mainValueString = formattedValue.split('.')[0];

        // イースターエッグの発動条件：入力欄が非フォーカスかつRESULTが4桁以上
        if (
            resultWrapper &&
            mainValueString.length >= 4
            // activeElement !== currentBpmInput &&
            // activeElement !== targetBpmInput
        ) {
            console.log('FUCK YOU!'); // コンソールに出力
            resultWrapper.textContent = 'FUCK YOU!'; // 表示をイースターエッグメッセージに
            bodyElement.classList.add(easterEggClass); // 専用クラスを追加
            return; // イースターエッグ発動で関数を終了
        }

        // 通常表示：結果をメインと小数部に分けて表示
        if (resultWrapper) {
            resultWrapper.innerHTML = defaultResultHtml; // デフォルトのHTML構造に戻す
            const currentMainValueSpan = resultWrapper.querySelector('.main-value');
            const currentDecimalValueSpan = resultWrapper.querySelector('.decimal-value');

            if (currentMainValueSpan && currentDecimalValueSpan) {
                const parts = formattedValue.split('.');
                currentMainValueSpan.textContent = parts[0];
                currentDecimalValueSpan.textContent = parts.length > 1 ? '.' + parts[1] : '';
            }
        }
        bodyElement.classList.remove(easterEggClass); // イースターエッグクラスを削除
    } else {
        // 入力値が無効な場合は結果表示をリセット
        resetResultDisplay();
    }
}

// RESULT表示を初期状態に戻すヘルパー関数
function resetResultDisplay() {
    if (resultWrapper) {
        resultWrapper.innerHTML = defaultResultHtml;
        const mainValueSpan = resultWrapper.querySelector('.main-value');
        const decimalValueSpan = resultWrapper.querySelector('.decimal-value');
        if (mainValueSpan && decimalValueSpan) {
            mainValueSpan.textContent = '-';
            decimalValueSpan.textContent = '';
        }
    }
    bodyElement.classList.remove(easterEggClass); // イースターエッグクラスを削除
}

// --- 入力フィールドの制御 ---
const bpmInputs = document.querySelectorAll('.bpm-input');

bpmInputs.forEach(inputElement => {
    // 入力時のバリデーションと計算
    inputElement.addEventListener('input', (event) => {
        let value = event.target.value.replace(/[^0-9]/g, ''); // 数字以外を除去
        value = value.slice(-3); // 3桁に制限
        
        let numValue = parseInt(value, 10);
        if (isNaN(numValue) || numValue < 0) {
            numValue = 0; // 無効な場合は0に
        }
        if (numValue > 999) {
            numValue = 999; // 999を超える場合は999に
        }
        event.target.value = String(numValue); // 変更を反映
        calculateAndDisplayResult(); // 計算と表示を更新
    });

    // フォーカスが外れた時の最終バリデーションと計算
    inputElement.addEventListener('blur', (event) => {
        let numValue = parseInt(event.target.value, 10);

        if (isNaN(numValue) || numValue < 0) {
            event.target.value = '0';
        } else if (numValue > 999) {
            event.target.value = '999';
        }
        calculateAndDisplayResult(); // 計算と表示を更新
    });
});

// --- モーダルウィンドウ（ヒント）の制御 ---
const hintButton = document.querySelector('.hint');
const hintContent = document.querySelector('.hint-cont');

if (hintButton && hintContent) {
    // ヒントボタンがクリックされたらモーダルを開閉
    hintButton.addEventListener('click', (event) => {
        hintContent.classList.toggle('is-active');
        // モーダルの表示状態に合わせてbodyのスクロールを制御
        document.body.style.overflow = hintContent.classList.contains('is-active') ? 'hidden' : '';
        event.stopPropagation(); // クリックイベントがdocumentまで伝播しないように停止
    });

    // モーダルコンテンツ内でのクリックは、モーダルを閉じないようにする
    hintContent.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // document全体へのクリック・タッチでモーダルを閉じる
    // PCではclick、スマホではtouchstartを主に使う
    const closeHintModal = (event) => {
        // クリック/タッチされた要素がヒントコンテンツ内でもヒントボタン内でもなく、
        // かつモーダルが表示中の場合
        if (
            !hintContent.contains(event.target) &&
            !hintButton.contains(event.target) &&
            hintContent.classList.contains('is-active')
        ) {
            hintContent.classList.remove('is-active'); // モーダルを非表示に
            document.body.style.overflow = ''; // スクロールを元に戻す
        }
    };
    document.addEventListener('click', closeHintModal);
    document.addEventListener('touchstart', closeHintModal);
}

// --- タップテンポ検出ロジック ---

// タップ間隔をリセットする関数
function resetTapTempo() {
    tapTimes = []; // タイムスタンプ配列をクリア
    if (resetTimerId) {
        clearTimeout(resetTimerId); // 既存のタイマーをクリア
    }
    // console.log("Tap tempo reset."); // デバッグ用ログ
}

// タップ開始時の処理ハンドラ
function handleTapStart(event) {
    // マウス左クリック以外は無視
    if (event.type === 'mousedown' && event.button !== 0) return;
    
    // タッチイベントのデフォルト動作（ダブルタップズームなど）を防ぐ
    if (event.type === 'touchstart') {
        event.preventDefault(); 
    }

    // リセットタイマーを一旦クリア
    if (resetTimerId) {
        clearTimeout(resetTimerId);
    }

    const currentTime = Date.now(); // 現在のタイムスタンプを取得
    tapTimes.push(currentTime);     // 配列に追加
    // console.log("Tap!", tapTimes); // デバッグ用ログ

    bodyElement.classList.add('tap-active'); // タップ時にbodyを光らせる

    // 最新の8回分のタップ時刻だけを保持（8回目以降は古いものを削除）
    if (tapTimes.length > 8) {
        tapTimes.shift(); 
    }

    // 8回タップされたら（7つの間隔が揃ったら）BPMを計算
    if (tapTimes.length >= 8) {
        const intervals = []; // 各タップ間隔を保存
        for (let i = 0; i < tapTimes.length - 1; i++) {
            intervals.push(tapTimes[i + 1] - tapTimes[i]);
        }

        const sum = intervals.reduce((a, b) => a + b, 0);
        const averageInterval = sum / intervals.length; // 間隔の平均値

        let detectedBPM = 60000 / averageInterval; // BPMに変換

        // 計算されたBPMを丸めて、0-999の範囲に制限する
        detectedBPM = Math.floor(detectedBPM); //四捨五入から切り捨てに修正
        if (detectedBPM < 0) { 
            detectedBPM = 0;
        }
        if (detectedBPM > 999) { 
            detectedBPM = 999;
        }

        currentBpmInput.value = Math.round(detectedBPM); // BPM入力欄に結果を設定
        calculateAndDisplayResult(); // 結果表示も更新
    }

    // 最後のタップから3秒間操作がなければリセットするタイマーを設定
    resetTimerId = setTimeout(resetTapTempo, 3000); 
}

// タップ終了時の処理ハンドラ
function handleTapEnd(event) {
    // マウス左クリック以外は無視
    if (event.type === 'mouseup' && event.button !== 0) return;
    
    bodyElement.classList.remove('tap-active'); // bodyの光るクラスを削除
}


// --- BPM増減ボタンの制御ロジック ---
// 特定の入力フィールドの値を増減させる関数
function adjustBpm(inputId, change) {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
        let currentValue = parseInt(inputElement.value, 10);
        if (isNaN(currentValue)) {
            currentValue = 0; // もし値がない場合は0から始める
        }
        let newValue = currentValue + change;

        // 値の範囲を0-999に制限
        if (newValue < 0) newValue = 0;
        if (newValue > 999) newValue = 999;

        inputElement.value = String(newValue);
        // 値が変更されたら、計算と表示を更新
        calculateAndDisplayResult();
    }
}

// 各BPMコントロールセットにイベントリスナーを設定する
function setupBpmControls() {
    document.querySelectorAll('.bpm-controls').forEach(controlGroup => {
        const targetInputId = controlGroup.dataset.target; // data-target属性から対象のinputIDを取得
        const minusBtn = controlGroup.querySelector('.minus-btn');
        const plusBtn = controlGroup.querySelector('.plus-btn');

        if (minusBtn) {
            minusBtn.addEventListener('click', (event) => {
                event.preventDefault(); // デフォルト動作をキャンセル
                adjustBpm(targetInputId, -1);
            });
            // スマホでのより即時的な反応のためにtouchstartも追加する
            minusBtn.addEventListener('touchstart', (event) => {
                event.preventDefault(); // デフォルト動作をキャンセル
                adjustBpm(targetInputId, -1);
            });
        }
        if (plusBtn) {
            plusBtn.addEventListener('click', (event) => {
                event.preventDefault(); // デフォルト動作をキャンセル
                adjustBpm(targetInputId, 1);
            });
            // スマホでのより即時的な反応のためにtouchstartも追加する
            plusBtn.addEventListener('touchstart', (event) => {
                event.preventDefault(); // デフォルト動作をキャンセル
                adjustBpm(targetInputId, 1);
            });
        }
    });
}


// --- イベントリスナーの登録と初期化 ---

// タップ検出関連のイベントリスナー
tapDetector.addEventListener('touchstart', handleTapStart);
tapDetector.addEventListener('mousedown', handleTapStart);
tapDetector.addEventListener('touchend', handleTapEnd);
tapDetector.addEventListener('mouseup', handleTapEnd);
tapDetector.addEventListener('touchcancel', handleTapEnd); // タップがキャンセルされた場合

// ページの読み込みが完了したら初期計算とタップテンポのリセットを実行
document.addEventListener('DOMContentLoaded', () => {
    calculateAndDisplayResult(); // 初期表示のため
    setupBpmControls(); // BPM増減ボタンのイベントリスナーを設定
});
resetTapTempo(); // アプリ起動時にタップテンポ履歴をリセット

// --- Service Workerの登録 ---
// PWAとしてオフライン対応などを行うため
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/BPMcalculater/service-worker.js')
            .then(registration => {
                console.log('Service Worker registered! Scope:', registration.scope);
            })
            .catch(error => {
                console.error('Service Worker registration failed:', error);
            });
    });
}