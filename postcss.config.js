module.exports = {
    plugins: [
      require('cssnano')({
        preset: ['default', {
          discardComments: {
            removeAll: true, // ここで全てのコメントを削除する設定
          },
        }],
      }),
    ],
  };