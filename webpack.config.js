const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // 開発モードか本番モードかを指定するよ
  // 本番モード('production')だと、JavaScriptも自動でminifyされるよ！
  mode: 'production', // 本番公開を意識して、ここでproductionにしておこう！

  // webpackがビルドを開始する場所（エントリーポイント）
  entry: './src/index.js',

  // バンドルされたファイルを出力する場所とファイル名
  output: {
    path: path.resolve(__dirname, 'dist'), // 'dist'フォルダに出力するよ
    filename: 'bundle.js', // 出力されるJavaScriptファイル名（minifyされるよ！）
    clean: true, // 新しいビルドの前に'dist'フォルダをクリーンアップするよ
    assetModuleFilename: '[name][ext]',
    publicPath: '/', // アセットのベースURLをルートに設定
  },

  // モジュール（ファイル）の処理方法を定義するよ
  module: {
    rules: [
      // JavaScriptファイルの処理（Babelを使う場合）
      // もしBabelをインストールしてなければこの部分はコメントアウトしてもOKだよ

      // SCSSとCSSファイルの処理
      {
        test: /\.(scss|css)$/,
        use: [
          'style-loader',       // 1. JSに変換されたCSSをHTMLに注入（最後に実行される）
          {
            loader: 'css-loader', // 2. CSSをJavaScriptのモジュールに変換
            options: {
              url: true,             // url() などを解決
              importLoaders: 2,      // postcss-loader と sass-loader の後にcss-loaderを実行
              sourceMap: false,
            },
          },
          'postcss-loader',     // 3. PostCSS (cssnano) でCSSを最適化・コメント削除
          'sass-loader',        // 4. SCSSをCSSにコンパイル（最初に実行される）
        ],
      },
      //画像ファイルの処理
      {
        test: /\.gif$/i, // .gifファイルだけを対象にする
        type: 'asset/inline', // ファイルの内容をbase64としてJSバンドルに埋め込む
      },
      {
        test: /\.(png|svg|jpg|jpeg)$/i, // .gif以外の画像は引き続きファイルとして出力
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]', // 他の画像はdist直下に出力
        },
      },
      // HTMLファイルの処理
      {
        test: /\.html$/,
        use: ['html-loader'], // HTMLファイルもWebpackで扱えるようにするよ
      },
    ],
  },

  // プラグインの設定（特別なタスクを実行するよ）
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html', // 元になるHTMLファイルの場所
      filename: 'index.html', // 出力されるHTMLファイル名
      inject: 'body', // <script>タグを<body>の直前に挿入する設定。HtmlInlineScriptPluginがこれをインライン化する
      
      // ★ここが大事！生成されるHTML、CSS、JSをまとめてminifyする設定だよ！
      minify: {
        collapseWhitespace: true, // 空白を削除
        removeComments: true,     // コメントを削除
        removeRedundantAttributes: true, // 不要な属性を削除
        removeScriptTypeAttributes: true, // scriptタグのtype属性を削除
        useShortDoctype: true,    // DOCTYPEを短縮
        // その他のminifyオプションも設定できるよ！
      },
    }),
    // ★JavaScriptをHTMLにインライン化するプラグインを追加！
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/bundle\.js$/], // 'bundle.js' をインライン化の対象にする
    }),

    new CopyWebpackPlugin({
      patterns: [
        { 
          from: 'src/icons/', // コピー元のディレクトリ
          to: 'icons/',      // コピー先のディレクトリ (distフォルダ内)
          noErrorOnMissing: true, // ソースが存在しなくてもエラーにしない
        },
        { 
          from: 'manifest.webmanifest', // ルートにあるマニフェストファイル
          to: './', // distフォルダの直下に出力
          noErrorOnMissing: true,
        },
        {
          from: 'service-worker.js', // ルートにあるService Workerファイル
          to: './', // distフォルダの直下に出力
          noErrorOnMissing: true,
        }
      ],
    }),
  ],

  // 開発サーバーの設定（これは開発用だから、本番ビルドには影響しないよ）
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress: true,
    port: 8080,
    open: true,
    historyApiFallback: true,
    watchFiles: ['src/**/*.html'],
  },
};