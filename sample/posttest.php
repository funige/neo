<?php
// 送信ボタンが押されると(POST)、サーバーでこのpnpが実行されて
// 画像とアニメーションがtemp/に保存されます
// ※ローカルでPHPの動く環境が必要です（MAMPなど）。
  
if(($_SERVER["REQUEST_METHOD"]) == "POST"){
  $timestamp = time().substr(microtime(),2,6);

  if(isset($_FILES['picture'])) {
    $png = "temp/".$timestamp.".png";
    move_uploaded_file($_FILES['picture']['tmp_name'], $png);
    chmod($png, 0606);
  }
  if(isset($_FILES['pch'])) {
    $pch = "temp/".$timestamp.".pch";
    move_uploaded_file($_FILES['pch']['tmp_name'], $pch);
    chmod($pch, 0606);
  }
  die("ok");
}
?>	

<!DOCTYPE html>
<!-- ブラウザで普通に呼ばれた時は(GET)、このhtmlが表示されます -->
<html lang="ja">
<head>
    <link rel="stylesheet" href="../dist/neo.css" type="text/css">
    <script src="../dist/neo.js" charset="UTF-8"></script>
</head>
<body>
  <a href="viewer.html">PCH Test</a>
  <h1>Post Test</h1>

  <div>
    <applet-dummy name="paintbbs" width="400" height="400">
      <param name="neo_send_with_formdata" value="true">
      <param name="thumbnail_type" value="animation">
      <param name="url_save" value="posttest.php">
      <param name="url_exit" value="posttest.php">
    </applet-dummy">
  </div>

  <style>
    #pageView {
      margin: 0 !important;
    }
  </style>

</body>
</html>
