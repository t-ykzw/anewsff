# anewsff

## これは何

anews をキーボード主体で操作したり記事をその場で読んだりするchrome拡張

## 使いかた

### 1. build

```sh
git clone https://github.com/t-ykzw/anewsff.git
cd anewsff
nodenv install $(cat .node-version)
npm i
npx vite build
echo "${PWD}/dist";  # このパスをコピー
```

### 2. install

1. chrome で `chrome://extensions` を開き，右上のデベロッパーモードを有効にする
2. パッケージ化されてない拡張機能を読み込む．で build のときにコピーしたパスを指定する
3. 特にエラーがでなければ ok

### 3. open anews

1. `https://anews.stockmark.ai/#/` を開いておもむろに j, k を押す

## 操作

### キーボード操作一覧

- `j` : ひとつ*下*の記事にフォーカス（スクロール）する
- `k` : ひとつ*上*の記事にフォーカス（スクロール）する
- `f` : フォーカスされてる記事をインラインで読み込む
- `q` : インラインで読み込んだ記事を閉じる
- `Enter` : フォーカスされてる記事をバックグラウンドのタブで開く
- `r` : ページ全体をリロード

## TODO

- [ ] iframe ではスクロールに支障があるのでやめたい
- [ ] 記事本文だけ取り出したい（Readability は拡張に入れられなかった）
- [ ] レイアウトちゃんとしたい
- [ ] テーマの切り替えとかもキーボードで行きたい
- [ ] タグ・コメントもキーボードで行きたい