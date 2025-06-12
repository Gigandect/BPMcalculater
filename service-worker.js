// service-worker.js

// キャッシュの名前を定義するよ！バージョンを上げていくことで古いキャッシュを更新できるんだ。
const CACHE_NAME = 'bpm-calculator-cache-v1.0.0'; // 例えば、バージョン番号を付けておくと管理しやすいよ

// アプリのオフライン動作に必須なファイルをリストアップするよ！
// ここにリストアップされたファイルは、Service Workerがインストールされた時にキャッシュされるんだ。
// パスは全てウェブサイトのルートからの相対パスで指定してね。
const urlsToCache = [
  '/BPMcalculater/',                     // アプリのトップページ (index.html)
  '/BPMcalculater/index.html',           // index.html自体
  // HTMLInlineScriptPluginを使っているからbundle.jsやbundle.cssは直接インクルードされないけど、
  // Service Workerがキャッシュする対象として、HTML自体をキャッシュすることが重要だよ。
  // background-imageで使ってるflash.gifも直接参照してるから、ここに含めるか確認
  // もしflash.gifをasset/resourceで出力しているなら、ここに追加が必要。
  // 今回asset/inlineでbundle.jsに埋め込んでるから、直接は不要だけど、
  // もし将来的に外部ファイルにしたらここに加えること！
  '/BPMcalculater/manifest.webmanifest', // Web App Manifestファイル
  '/BPMcalculater/service-worker.js',    // Service Worker自身もキャッシュしておくと安心
  '/BPMcalculater/icons/icon-192x192.png', // マニフェストで指定したアイコン
  '/BPMcalculater/icons/icon-512x512.png',
  '/BPMcalculater/icons/icon-maskable-192x192.png',
  '/BPMcalculater/icons/icon-maskable-512x512.png',
  // 必要に応じて、アプリ内で使われる他の画像、フォント、JSONデータなども追加するよ！
  // 例: '/images/background.jpg', '/data/songs.json', '/fonts/myfont.woff2'
];

// 1. Service Workerのインストールイベント
// Service Workerがブラウザにインストールされた時に発生するよ。
// ここで、アプリの起動に必要な主要なファイルをキャッシュに保存するんだ。
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  // waitUntil() は、Promiseが解決されるまでインストール処理を待機させるよ
  event.waitUntil(
    caches.open(CACHE_NAME) // 定義した名前で新しいキャッシュを開く
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache); // リストアップした全てのファイルをキャッシュに追加
      })
      .catch((error) => {
        console.error('[Service Worker] Cache addAll failed:', error);
      })
  );
  // Service Workerがインストールされたらすぐにアクティブになるようにする
  // これにより、ページの再読み込みを待たずにService Workerが制御を開始できる
  self.skipWaiting();
});

// 2. Service Workerのアクティベートイベント
// 新しいService Workerがインストールされて、古いService Workerが完全に制御を失った時に発生するよ。
// ここで、古いキャッシュをクリーンアップするんだ。
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => { // 現在のキャッシュのキー（名前）を全て取得
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 現在のキャッシュ名と異なる（つまり古い）キャッシュを削除するよ
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Service Workerがアクティベートされたら、クライアント（ページ）を制御するように要求する
        return self.clients.claim();
    })
  );
});

// 3. フェッチイベント (リクエストの横取り)
// ブラウザが何かをリクエストするたびに発生するよ（HTML、CSS、画像、APIなど）。
// ここで、キャッシュから返すか、ネットワークから取得するかを判断するんだ。
self.addEventListener('fetch', (event) => {
  // navigationリクエスト（HTMLファイルのロード）は、常にネットワークから最新のものを取得し、
  // 取得できたらキャッシュを更新する（Stale-While-Revalidate に近い）
  // ただし、オフライン時はキャッシュから返す
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // ネットワークがオフラインの場合やエラーの場合、キャッシュからHTMLを返す
        return caches.match('/BPMcalculater/index.html'); // トップページを返すことが多い
      })
    );
    return; // navigateリクエストの処理はここまで
  }

  // それ以外のリクエスト（画像、CSS、JSなど）は、キャッシュ優先戦略 (Cache-First)
  // まずキャッシュにヒットするか確認し、あればキャッシュから返す
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // キャッシュにあればキャッシュから返す
        if (response) {
          console.log('[Service Worker] Serving from cache:', event.request.url);
          return response;
        }

        // キャッシュになければネットワークから取得する
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // ネットワークから取得したレスポンスをキャッシュに追加（ストリームは一度しか読めないのでクローンする）
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          });
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed and no cache match for:', event.request.url, error);
        // ここでオフライン時のフォールバックコンテンツ（例えば、オフラインページなど）を返すこともできるよ
        // return caches.match('/offline.html');
      })
  );
});