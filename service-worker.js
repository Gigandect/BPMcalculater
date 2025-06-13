// service-worker.js

// キャッシュの名前を定義（新しいバージョンで更新できるようバージョン番号を含む）
const CACHE_NAME = 'bpm-calculator-cache-v1.0.0';

// オフライン動作に必要なファイルのリスト
// これらはService Workerがインストールされたときにキャッシュされるよ
const urlsToCache = [
  '/BPMcalculater/',                     // アプリのトップページ（index.html）
  '/BPMcalculater/index.html',           // index.html自体を明示
  '/BPMcalculater/manifest.webmanifest', // Web App Manifest
  '/BPMcalculater/service-worker.js',    // Service Worker自身
  '/BPMcalculater/icons/icon-192x192.png', // アプリのアイコン
  '/BPMcalculater/icons/icon-512x512.png',
  '/BPMcalculater/icons/icon-maskable-192x192.png',
  '/BPMcalculater/icons/icon-maskable-512x512.png',
  // 必要に応じて、追加の画像やフォントなどもここに追加する
];

// --- 1. Service Workerのインストール ---
// Service Workerがブラウザに登録されたときに、必須ファイルをキャッシュに保存する
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME) // 新しいキャッシュを開く
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache); // 定義されたファイルを全てキャッシュ
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
  self.skipWaiting(); // インストール後すぐにアクティブ化
});

// --- 2. Service Workerのアクティベート ---
// 新しいService Workerが有効になったときに、古いキャッシュをクリーンアップする
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ名と異なる（古い）キャッシュを削除
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Service Workerがページを制御を開始
    })
  );
});

// --- 3. フェッチイベント（リクエストの横取りとキャッシュ戦略） ---
// ブラウザからの全てのリクエストをここで横取りし、キャッシュ戦略を適用する
self.addEventListener('fetch', (event) => {
  // ナビゲーションリクエスト（HTMLページのロード）の場合の処理
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // ネットワークから最新のHTMLを取得しようと試みる
      fetch(event.request).catch(() => {
        // ネットワークエラー時（オフライン時など）はキャッシュからindex.htmlを返す
        return caches.match('/BPMcalculater/index.html');
      })
    );
    return; // ナビゲーションリクエストの処理はここで終了
  }

  // それ以外のリクエスト（CSS, JS, 画像など）は「キャッシュ優先」戦略
  event.respondWith(
    caches.match(event.request) // まずキャッシュにリクエストがあるか確認
      .then((response) => {
        // キャッシュにあればそれを返す
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // キャッシュになければネットワークから取得
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // ネットワークから取得した有効なレスポンスをキャッシュに追加
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone(); // レスポンスは一度しか読めないのでクローン
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse; // ネットワークレスポンスを返す
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed and no cache match for:', event.request.url, error);
        // 必要に応じて、オフライン時のフォールバックコンテンツをここで返す
        // 例: return caches.match('/offline.html');
      })
  );
});