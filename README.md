# PaintBBS NEO

![ver1.5.1](https://cdn-ak.f.st-hatena.com/images/fotolife/f/funige/20181205/20181205141944.png)

お絵描きしぃ掲示板 PaintBBS (&copy;2000-2004 しぃちゃん) を html5 化するプロジェクトです。

作者行方不明のため、許諾は取れていません。

しぃちゃんのホームページ（Vector）  
http://hp.vector.co.jp/authors/VA016309/

**Flash や html5 のお絵描きサイトはいっぱいあるんだけど、そうじゃないんだ。  
おじさんは昔の java アプレットそっくりの環境が欲しいんだ。**

1. 掲示板に投稿できる Mac/Win 用のアプリを開発します(中身は javascript)

2. PaintBBS と見た目や操作性がだいたい同じになってきたら、  
   管理人さんに連絡取って直接組み込んでもらうことを目指します

:

**……というわけで、ふたばで NEO が使えるようになりました！**

    105 名前：◆管理人 投稿日：2017/01/19(木) 02:20 del
    落書き板に組み込みました
    http://nov.2chan.net/q/futaba.htm
    調子が良ければ他のお絵かき板にも導入します

### <a name="animation">動画記録について</a>

v1.5 で動画記録をサポートしました。
Java 版の動画データ（.pch）が解析不能なため、動画データの互換性はありません。

## <a name="browser">対応環境</a>

Chrome/FireFox/Safari/Edge
iOS(Mobile Safari)  
 ※ 最新のバージョンのみ

IE はサポート対象外です  
 Android でもだいたい動くのですが、サポート対象外とします

Windows で線がうまく引けない場合は、以下をお試しください

- Chrome を使う
- Wacom のタブレットを使用している場合は「デジタルインクを使用する」をオフにする

[Firefox(59 以降？)はタブレット関係のバグがあるらしく、](http://neo.websozai.jp/potiboard.php?res=553)線が乱れることがあるようです。  
マルチプロセスを切ると症状が解消されるかもしれません。（about:config で browser.tabs.remote.autostart を False）

Chrome(80 以降？)で横に長い線を引くとジェスチャーと誤認識される場合は、chrome://flags/#overscroll-history-navigation でジェスチャーを無効にするといいかもしれません。

## <a name="deploy">お絵かき掲示板の設置方法について</a>

新しくお絵かき掲示板を設置したい方には、POTI-board 改の利用をお勧めします。

- [POTI 改公式サイト](https://paintbbs.sakura.ne.jp/poti/)

公式サイトには[設置サポート掲示板](https://paintbbs.sakura.ne.jp/cgi/neosample/support/)があります。  
掲示板の設置に関するご質問・不具合の報告等ありましたら、遠慮なくこちらへどうぞ。

まだ古い POTI-baord を稼働中の方のための[移行ガイド](README-potiboard.md)  
(古い PHP のコードには色々問題がありますので、お勧めできません)

- PaintBBS オリジナルの起動オプションについては[オリジナルの README](https://web.archive.org/web/20070822002857/https://hp.vector.co.jp/authors/VA016309/paintbbs/document/Readme_Shichan.html)
- NEO 独自のオプションについては、[NEO の独自拡張について](README-params.md)を参照してください。

**掲示板の設置以外についての質問・要望は[こちら](https://github.com/funige/neo/issues)でお願いします。**

## [動作確認用掲示板](http://futabize.websozai.jp)

以前ここで公開していた旧掲示板は[こちら](http://neo.websozai.jp)。

## <a name="app">Mac/Win 用アプリについて</a>

Mac/Win 用アプリは、NEO 開発の過程で使われたものです。  
NEO の入っていない掲示板に投稿して、動作を確認することができたのですが……

残念ながら、electron のバージョンアップで動かなくなってしまいました。
<s>そのうち直して再アップロードしたいと思います。</s>

<!--
Mac/Win 用アプリは、NEO 開発の過程で使われたものです。
NEO の入っていない掲示板に投稿して、動作を確認することができます。
バイナリは重いので削除しました。
興味のある方はソースコードからビルドしてください。

    > git clone https://github.com/funige/neo.git
    > cd neo
    > npm install
    > npm run app
-->

## <a name="history">履歴</a>
#### ver1.6.18 (2025/06/08)
- **&lt;PARAM NAME="neo_max_pch" VALUE="(post_max_size 単位MB)">**  
で、サーバの`post_max_size`を渡し超過する時はアニメーションデータを切り捨てて画像の投稿を成功させます。  
そして、このパラメータの値が0だった時は、オリジナルのパラメータ`animation_max`と同じように、無制限にします。  
サーバから値を取得できなかった時に0が渡される可能性があり、0で無制限としなければ投稿が失敗するからです。
#### ver1.6.17 (2025/4/12)
- これまでマウスに最適化されていた、動画再生の進捗バーの位置を指定して一時停止･巻き戻しを行う操作がスマホ･タブレットでもできるようになりました。
- 動画再生画面で拡大表示した時の画像のスクロールがスマホ･タブレットでもできるようになりました。

#### ver1.6.16 (2025/4/10)
Chrome135のデフォルトフォントが"Noto Sans JP"に変わり文字がかすれて読めなくなってしまったため、
`neo.css`から

> font-weight: 100;

を削除しました。  
  
![image](https://github.com/user-attachments/assets/ce0ca032-cef1-4e41-89e6-4d440070f487)  
↑  
Chrome135で文字のかすれが発生。    
  
![image](https://github.com/user-attachments/assets/60b82f48-4b78-40b1-ab24-9fb601433ea9)  
↑  
修正後。  

#### ver1.6.15 (2025/3/24)
- **&lt;PARAM NAME="neo_validate_exact_ok_text_in_response" VALUE="true">**  
このフラグを true にするとサーバから返って来た文字列が"ok"では無かった時にエラーメッセージをアラートで表示して描画中の画面から移動しません。    
PHP等で、`die("ok")`のように指定する必要があるため、対応していないPHPで、このフラグをtrueにすると投稿できなくなってしまいます。  
そのため**デフォルトは false です**。  

- エラーメッセージをより詳細に表示

- 各ステータスコードとその内容を｢投稿に失敗。時間を置いて再度投稿してください。｣と組み合わせて表示します。
  
   ![Screen-2025-03-22_15-37-49](https://github.com/user-attachments/assets/648f019b-a6c8-4e41-bb3f-0219d04d4920)  
    ↑  
  日本語。  
  ![Screen-2025-03-22_15-36-25](https://github.com/user-attachments/assets/ff779ab5-dae7-42c4-8874-df7473f14124)  
  ↑  
  英語。  
  ![Screen-2025-03-22_15-35-24](https://github.com/user-attachments/assets/1bd343b7-fe31-459e-8b0d-54093141553c)  
  ↑  
  スペイン語。

- ふたばを判定している正規表現を修正しました。

#### ver1.6.12 (2025/1/15)
- **&lt;PARAM NAME="neo_disable_grid_touch_move" VALUE="true">**  
  このフラグを true にすると、キャンバス周辺の格子模様の箇所をタッチしてもスクロールしなくなります。  
  これによりWindows Inkが有効な時やAndroidやiPad等のモバイルデバイス使用時に発生していた意図しない画面スクロールを防止します。  
  ただし、端末の画面の幅がアプレットの幅+100px以下の時には、従来と同じように、キャンバス周辺の格子模様の箇所でスクロール操作が可能で画面が上下左右に動きます。  
  画面が狭い端末の時には格子模様の箇所でスクロールしなければならなくなるからです。  
  また、ピンチズーム使用時にも格子模様の箇所でスクロール操作が可能になります。  
  [コピー、レイヤー結合、消し四角などの操作で画面全体が上下に動く。しかし、ピンチズーム時や幅の狭い端末では網目の上でスクロールできなくなると操作不能になる。 · Issue #95](https://funige.github.io/neo/issues/95.html)  
  **デフォルトは false です**  
- スポイトのショートカットキー｢Alt｣を押下した時のFirefoxのメニューの開閉を防止する処理を追加しました。
- キャンバス画面への動画データ読み込み時に、アニメーションをスキップした時には静止画取得以前のアンドゥの履歴を動画から取得しないようにしました。  
#### ver1.6.11 (2024/12/22)
- **&lt;PARAM NAME="neo_animation_skip" VALUE="true">**  
  このフラグを true にすると、キャンバス画面への動画データ読み込み時に、アニメーション再生をスキップします。  
  キャンバス画面で動画を再生する事なく、レイヤー情報を取得します。  
  オリジナルのPaintBBSにより近い動作になります。    
  これまでは、キャンバスをタップするまでアニメーションが再生されていました。  
  このパラメータが未設定の時は、従来と同じように画面をタップするまでアニメーションを再生します。       
  **デフォルトは false です**  

#### ver1.6.10 (2024/12/12)
- オリジナルのPaintBBSに存在していたパラメータ **&lt;PARAM NAME="animation_max" VALUE="(file size 単位kb)">** を実装しました。
> animation_max length of data for animaion(KByte. default value is 0)  
> アニメーションデーターの最大値をKByte単位で指定します。  
> 大体の目安でこの値に制限する為、多少前後します。  
> 0で制限無し。  

([Readme_Shichan.html](Readme_Shichan.html))
  
- NEOの独自パラメータ **&lt;PARAM NAME="neo_max_pch" VALUE="(post_max_size 単位MB)">**  
よりも**animation_max**が優先されます。 
また、**neo_max_pch**は、formDataによる送信時にのみ動画ファイルの投稿を制限しますが**animation_max**は、送信方式に関係なく制限します。  

#### ver1.6.9 (2024/12/10)
- **&lt;PARAM NAME="neo_confirm_layer_info_notsaved" VALUE="true">**  
  このフラグを true にすると、「動画」が記録されていない時に「レイヤー情報は保存されません。続行してよろしいですか?」という確認ダイヤログが開くようになります。  
  **デフォルトは false です**
#### ver1.6.8 (2024/11/15)
- 動的パレットスクリプトの影響で｢窓｣ボタンが押せなくなるケースがあるため、｢窓｣ボタンのz-indexを調整して対応しました。
- Chromeでは描画時に通常のカーソルが消えてしまうため、8px以下の時にも円カーソルを表示します。
#### ver1.6.7 (2024/11/15)
- 100px以下の小さなキャンバスサイズのときに操作できなくなっていたのを修正し、オリジナルのPaintBBSの表示に近づけました。  
#### ver1.6.6 (2024/09/30)
- ページ移動してしまった時の画像の復元処理を改善しました。
- もとの画像よりも小さなキャンバスサイズで開いてしまっても再度もとのキャンバスサイズで開きなおせば画像が復元できるようになりました。
- これまでは、小さなキャンバスサイズで開いてしまうと、そのサイズで画像が切り取られていました。

#### ver1.6.5 (2024/09/28)
- 復元データのバックアップがページ移動時に加え、10ストローク単位でも保存されるようになりました。
- PC使用時のデータの保存先をセッションストレージからモバイル端末使用時と同じようにローカルストレージに変更。
- ブラウザを完全に閉じてしまったり、停電等により予期しない電源断が発生した時にも描画していた画像を復元できるようになりました。

#### ver1.6.3 (2024/03/14)

- [#106 PARAM NAME=name="neo_max_pch"の説明追加とmagic (3byte: 4e 45 4f)](https://funige.github.io/neo/pulls/106.html)
- [#107 画面移動の関数が定義されている時はユーザーが定義した関数で画面移動](https://funige.github.io/neo/pulls/107.html)
- [#108 {passive\_ false}を明示的に指定。](https://funige.github.io/neo/pulls/108.html)
- [#109 ブラウザデフォルトのショートカットキー｢ctrl+o｣を無効化。](https://funige.github.io/neo/pulls/109.html)

- Git LFSへの依存解消のためリポジトリを再作成しました。  
  詳細は[README-neo2.md](README-neo2.md)を参照。

  フォークは自動的に更新されないため、新リポジトリから再度フォークする必要があります。

#### ver1.6.2 (2024/02/15)

- [#100 サーバのPOSTの上限を超えるPOST時に動画、画像ともに投稿に失敗する問題](https://funige.github.io/neo/pulls/100.html)
- [#102 パレットマトリクスのtextareaでキー入力ができない問題を修正](https://funige.github.io/neo/pulls/102.html)

- README-development.md を追加しました。
- package.jsonのバージョン番号を変更するとソースコード内のバージョン番号も同期して更新されるようになりました。

#### ver1.6.1 (2023/12/25)

- [#99 オリジナルのPaintBBSと同じように、描画中に円カーソルを表示したままにする](https://funige.github.io/neo/pulls/99.html)

#### ver1.6.0 (2023/6/05)

- WAF 誤検知等の問題に対処するため、画像やアニメーションデータを formData で送信する機能がつきました。作っていただいた @satopian さんに感謝。

  &lt;param name="neo_send_with_formdata" value="true">

  で有効になります。詳細は[サンプル](sample/README.md)参照。

- 時代遅れになった javascipt を使っている部分を修正。これも@satopian さん提供です。

#### ver1.5.16 (2022/12/22)

- 送信失敗時のエラーメッセージの追加と修正です。

#### ver1.5.15 (2021/11/07)

- &lt;param name="neo_show_right_button" value="true">  
  を指定すると、デスクトップでも「右」ボタンが常時表示されるようになりました。

#### ver1.5.14 (2021/10/03)

- url_save を指定しないと投稿できなくなっていた問題を修正

#### ver1.5.12 (2021/06/05)

- [LiveConnect の仕様](https://hp.vector.co.jp/authors/VA016309/paintbbs/document/Readme_Shichan.html#js)にあった document.paintbbs.speed を実装しました。

#### ver1.5.11 (2021/05/16)

- 送信エラーが発生した時の動作を改善しました。  
  失敗した時は URL 遷移しません。  
  成功しても応答が「error\n」ではじまる文字列だった場合は
  [仕様通り](http://hp.vector.co.jp/authors/VA016309/paintbbs/document/Readme_Shichan.html#error_message)エラーになります。
- url_save, url_exit でオリジナルと同じように絶対バスが指定できるようになりました。
- POST の MIME を application/octet-stream に変更しました。  
  (ふたばでは互換性を重視して従来通り applicatio/octet-binary です)  
  もし問題が発生する環境があれば個別に対応しますので、連絡ください。

#### ver1.5.10 (2020/09/21)

- 投稿ボタン連打対策を入れました

#### ver1.5.9 (2020/06/22)

- オリジナルの PaintBBS にあったセキュリティ関連のオプションを実装しました。

  &lt;param name="neo_emulate_security_error" value="true">

  にすると、描画時間やクリック回数が少ない時に投稿を拒否して、任意の URL に飛ばすことができます。  
  [README-potiboard.md にも追記しました](README-potiboard.md)  
  **デフォルトは false です**

#### ver1.5.8 (2020/06/14)

- （v1.5.7 のソースコードを prettier で整形しただけです）

#### ver1.5.7 (2020/06/08)

- Chrome で左から右にスワイプした時に前の画面に戻ってしまう問題の対処ですが……

  &lt;param name="neo_confirm_unload" value="true">

  にすると、戻るボタンを押した時などに「このサイトを離れますか？」という警告が出るようになります。  
  **デフォルトは false です**

#### ver1.5.6 (2020/05/10)

- samplebbs の保守が困難になっていたので、リポジトリから削除しました
- Apache で mod_pagespeed を使った時、正しく表示されない問題に対処しました

#### ver1.5.5 (2020/04/11)

- line を使った動画の再生でなぜか無限ループに入ることがあったので対処
- ツールの位置の左右入れ替えができるようになりました。

  Neo.setToolSide(true) // true|false

  true のときツールはキャンバスの左側になります

#### ver1.5.4 (2019/10/23)

- iPadOS で右ボタンが表示されない問題を修正

#### ver1.5.3 (2019/8/19)

- ベジェ曲線のプレビューの表示方法がオリジナルの PaintBBS と違っていたのを修正
- Chrome67 以降でベジェ曲線のプレビューが重くなっていたのを高速化

#### ver1.5.2 (2019/8/2)

- 動画の再生エラーをちょっとだけ修正

#### ver1.5.1 (2018/11/29)

- 「続きを描く」は表示までに時間がかかるので、途中経過を表示するようにしました  
  　アニメーション中にキャンバスをクリックすると、再生を省略します
- コピーを中断して四角ツール等を使うとコピーした矩形がずっと画面に残ってしまっていたのを修正

#### ver1.5.0 (2018/11/25)

- ビューアの再生速度を変更できるようにしました
- IE11 で投稿できなくなっていた問題を修正

#### ver1.4.11 (2018/11/13)

- ビューアのボタン類の実装
- 動画の再生に失敗しても続きから描けるようにしました

#### ver1.4.10 (2018/11/2)

- ぼかしツールとベジェ曲線をさらに修正

#### ver1.4.9 (2018/10/30)

- ベジェ曲線が点線になる問題を修正

#### ver1.4.8 (2018/10/26)

- 消し四角とぼかしツールもバグってたので修正しました

#### ver1.4.6 (2018/10/23)

- 全消しで動画が途切れるバグを修正
- 消しゴムの透明度が動画で再現されないバグを修正

#### ver1.4.5 (2018/10/17)

- 動画記録お試し版  
  　オリジナルの PaintBBS と同じように動画を記録することができますが、  
  　動画データ（拡張子 pch）の互換性はありません。

#### ver1.3.4 (2018/05/30)

- 裏技ですが、JavaScript コンソールに

  Neo.painter.inputText.style.fontFamily="serif"

  とか入力してテキストツールのフォントを変更できるようになりました
  （某所で要望があったので……）

#### ver1.3.3 (2018/05/17)

- スペイン語対応 (Spanish support)

#### ver1.3.1 (2018/04/16)

- 画面外にドラッグした時にいろいろ不具合が出ていたのを修正

#### ver1.3.0 (2018/04/04)

- 対応環境に iOS(Mobile Safari)を追加
- 「右」ボタンの場所を右側に変更

#### ver1.2.9 (2018/03/30)

- モバイルで画面左上に「右」ボタンが表示されるようになりました
  「右」をタップ → ツールをタップで右クリックと同じ動作になります
  変な UI ですがこれが昔風でいいのではないかと...

#### ver1.2.8 (2018/03/22)

- safari でリロードした時に画像が保存されないバグを修正
- iPad pro でペンを使った時にボタンが押せないバグを修正

#### ver1.2.6 (2018/02/22)

- 既に NEO が組み込まれている掲示板をアプリ版の NEO で開いた時は二重起動の警告を表示するようにしました
- モバイルでスライダを動かすと全体がスクロールしてしまうバグを修正
- 日本語以外の環境ではメッセージを英語で表示するように修正

#### ver1.2.3 (2017/12/31)

- Safari(iOS、MacOS)でキャンバスの右端や下端の描画がおかしくなるバグを修正。

#### ver1.2.2 (2017/12/24)

- Android の Chrome で描けなくなっていたのを修正。

#### ver1.2.1 (2017/12/19)

- 著作権表示のしぃちゃんの名前が「しいちゃん」になってたのを修正。  
  どうも ver0.3 の頃からずっと間違ってたようです。すみません。

#### ver1.2.0 (2017/12/11)

- ページを離れるときに警告のポップアップを出す機能は問題が多いので  
  <s>デフォルトではオフにしました</s>削除しました

#### ver1.1.16 (2017/11/25)

- 塗り潰しのバグ修正できたかも？
- ブラシサイズを変更するとトーンの柄がずれるバグを修正
- クレジット表記のボタンを押した時の挙動を新窓表示に変更
- <s>ページを離れるときに警告のポップアップを出すように修正(ちょっとうるさいですが)</s>
- RGB スライダを動かすとカレントパレットの色も変わるように修正
- WonderCatStudio の動的パレットで getColors の値がおかしかった問題を修正

#### ver1.1.12 (2017/9/9)

- 掲示板開発者用の paintBBSCallback がちゃんと実装されていなかったので実装

#### ver1.1.11 (2017/8/16)

- スポイトツールのバグ修正

#### ver1.1.10 (2017/8/11)

- <s>/samplebbs/[README.md](https://github.com/funige/neo/tree/master/samplebbs/README.md)修正。</s>
- スポイトツールの動作変更
- ベジェツールを微妙に調整
- Chrome でペンを認識しなくなることがあるので PointerEvents を使うように修正

#### ver1.1.9 (2017/7/27)

- キャンバスの端でぼかしブラシを使うと白が混じるのを修正
- ズーム時にブラシを画面外に出すと画面が点滅する不具合を修正
- カーソルのゴミが画面端に残ってしまうことがあるのを修正

#### ver1.1.8 (2017/7/10)

- Edge と IE ではまだバグが残っていることがわかったので、警告表示を復活しました  
  ※Edge40 以上（userAgent 文字列では Edge/15 と表示されます）でバグが治ったのが確認されています

#### ver1.1.6 (2017/5/23)

- Chrome58 以降でふたばの画像掲示板に投稿すると失敗する問題を修正できたような気がします

#### ver1.1.5 (2017/5/10)

- Chrome58 以降でふたばの画像掲示板に投稿すると失敗するようになったので警告表示を追加しました

#### ver1.1.4 (2017/3/27)

- サムネール投稿のバグ修正
- アプレットの高さが足りないときレイアウトが崩れるのを修正しました

#### ver1.1.3 (2017/3/16)

- ベジェツールの修正。オリジナルの PaintBBS に近い、ちょっと太い線にしました

#### ver1.1.2 (2017/3/8)

- 画面をズームした時にペン先がずれる問題を修正
- ベジェツールのハンドルの表示を修正

#### ver1.1 (2017/1/31)

- ブラウザが IE と Edge の場合ふたばへの投稿に失敗するので、  
  これらのブラウザで起動すると警告を表示するようにしました。

- テキスト入力ツールの不具合修正
- 保管ペンのバグ修正
- カラースライダの上で shift+クリックして値を 1 ずつ上下できるように修正
- その他細かいバグ修正

#### ver1.0 (2016/12/22)

- バグ修正

  だいたい終了です  
  加算逆加算は結局できませんでした  
  そのうち誰かが直してくれると期待して撤退……

![ver1.0](https://cdn-ak.f.st-hatena.com/images/fotolife/f/funige/20161221/20161221215643.png?1482325021)

#### ver0.9 (2016/12/18)

- <s>Edge 対応</s>
- <s>IE 対応</s>
- バグ修正

#### ver0.8 (2016/12/13)

- ベジェ曲線
- 角取り・ぼかし
- 加算・逆加算テスト
- リロードした時にキャンバスが保存されるように修正
- Chrome でドラッグ中のカーソルがおかしくなる問題を修正

  残り時間でバグをできるだけ取ります

#### ver0.7 (2016/12/5)

- 覆い焼き・焼き込み
- テキスト入力テスト
- サンプル掲示板設置

#### ver0.6 (2016/11/22)

- 水彩と鉛筆はどうやっても似ないのでひとまずこれで
- トーン
- 直線
- 傾け
- 四角とか楕円とか

  しんどい

#### ver0.5 (2016/11/3)

- スクロールバーをちゃんと表示するように修正
- キーボードショートカットを一部実装
- コピーツールのテスト
- 保管ペンのテスト
  ![ver0.5](https://cdn-ak.f.st-hatena.com/images/fotolife/f/funige/20161103/20161103013321.png?1478104440)  
  だいぶ飽きてきましたが  
  年末までには何とか ver1.0 にしたいと思います

#### ver0.4.5 (2016/10/23)

- ブラウザ化テスト
- 画像の解像度を選んで描きはじめられるようになりました

  お絵かき本体はあんまり進んでないです

- 消し四角・レイヤー結合・上下反転・左右反転
- マウスポインタが指の形になっていたのを修正
- 消しペンにもマスクがかかるように修正

#### ver0.4 (2016/10/11)

- ウィンドウビュー
- マスク・逆マスク
- ボタンとかスライダとか実装

- カーソルをちゃんと xor で表示するように修正

#### ver0.3 (2016/10/4)

- 鉛筆・消しペン・塗り潰し
- 透明度
- 拡大した画像をスクロールできなかったのを修正
- マスクのテスト
- 外部のブラウザに飛ばずに送信画面を自分で開いてみるテスト  
  ![ver0.1](https://cdn-ak.f.st-hatena.com/images/fotolife/f/funige/20161004/20161004190655.png?1475575647)

#### ver0.2 (2016/9/28)

いろいろ中途半端なのでこのバージョンは見送ったほうがいいです

#### ver0.1 (2016/9/21)

とりあえず画像を既存の掲示板に送信するところだけ作って検証  
 ![ver0.1](https://cdn-ak.f.st-hatena.com/images/fotolife/f/funige/20160922/20160922095441.png?1474505726)

---

- しぃペインターとか Poo とかは作りません
