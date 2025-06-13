const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // ビルドモードの指定（開発用か本番用か）
  // 'production'にすると、JavaScriptが自動でminifyされるよ
  // mode: 'production', 

  // エントリーポイント: webpackがビルドを開始するJavaScriptファイル
  entry: './src/index.js',

  // 出力設定: バンドルされたファイルの保存場所とファイル名
  output: {
    path: path.resolve(__dirname, 'dist'), // 出力先ディレクトリ
    filename: 'bundle.js',                 // JavaScriptバンドルファイル名
    clean: true,                           // 新しいビルドの前に'dist'フォルダをクリーンアップ
    assetModuleFilename: '[name][ext]',    // アセットモジュールのファイル名テンプレート
    // 本番環境では '/BPMcalculater/'、開発環境では '/' を使用
    publicPath: process.env.NODE_ENV === 'production' ? '/BPMcalculater/' : '/', 
  },

  // モジュールルール: 各種ファイルの処理方法を定義
  module: {
    rules: [
      // JavaScriptファイルの処理: Babelを使ってモダンなJS構文を変換
      {
        test: /\.js$/,          // .jsファイルを対象
        exclude: /node_modules/, // node_modulesディレクトリは除外
        use: {
          loader: 'babel-loader',
          options: {
            presets: [['@babel/preset-env', { modules: false }]],
          },
        },
      },
      // SCSS/CSSファイルの処理: SCSSをCSSにコンパイルし、HTMLに注入
      {
        test: /\.(scss|css)$/,
        use: [
          'style-loader',       // JSに変換されたCSSをHTMLに注入
          {
            loader: 'css-loader', // CSSをJSモジュールに変換
            options: {
              url: true,             // url() 関数を解決
              importLoaders: 2,      // 後続のローダーの後にcss-loaderを実行
              sourceMap: false,
            },
          },
          'postcss-loader',     // PostCSSでCSSを最適化
          'sass-loader',        // SCSSをCSSにコンパイル
        ],
      },
      // GIF画像の処理: ファイル内容をBase64としてJSバンドルに埋め込む
      {
        test: /\.gif$/i,
        type: 'asset/inline',
      },
      // その他の画像ファイルの処理: ファイルとして出力
      {
        test: /\.(png|svg|jpg|jpeg)$/i,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]', // 出力ファイル名
        },
      },
      // HTMLファイルの処理: HTMLをWebpackで扱えるようにする
      {
        test: /\.html$/,
        use: ['html-loader'],
      },
    ],
  },

  // プラグイン設定: ビルドプロセスで特別なタスクを実行
  plugins: [
    // HTMLファイルを生成し、バンドルされたJS/CSSを注入
    new HtmlWebpackPlugin({
      template: './src/index.html', // 元になるHTMLファイル
      filename: 'index.html',     // 出力されるHTMLファイル名
      inject: 'body',             // <script>タグを<body>の直前に挿入
      // 生成されるHTML, CSS, JSをminify（最適化）
      minify: {
        collapseWhitespace: true,      // 空白を削除
        removeComments: true,          // コメントを削除
        removeRedundantAttributes: true, // 不要な属性を削除
        removeScriptTypeAttributes: true, // scriptタグのtype属性を削除
        useShortDoctype: true,         // DOCTYPEを短縮
      },
    }),
    // 生成されたJavaScriptをHTMLファイルに直接インライン化
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/bundle\.js$/], // 'bundle.js'をインライン化の対象に
    }),
    // 指定されたファイルを'dist'フォルダにコピー
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/icons/', to: 'icons/', noErrorOnMissing: true }, // アイコンフォルダ
        { from: 'manifest.webmanifest', to: './', noErrorOnMissing: true }, // マニフェストファイル
        { from: 'service-worker.js', to: './', noErrorOnMissing: true },   // Service Workerファイル
      ],
    }),
  ],

  // 開発サーバー設定: 開発中のライブリロードなどを提供
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
      watch: true,
    },
    compress: true, // サーバーからのレスポンスを圧縮
    port: 8080,     // サーバーポート
    open: true,     // サーバー起動時にブラウザを自動で開く
    historyApiFallback: true, // SPAのための設定
    hot: true,      // ホットモジュール置換を有効に
  },
};