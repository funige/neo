// グローバル名前空間として公開する PaintBBS NEO の実行時オブジェクト。
// 段階的な移行の間も、連結済みスクリプトの公開 API を保つために拡張可能にする。
interface NeoInterface {
    [key: string]: any;
    painter: any; // 必要に応じて具体的な型に置き換え
    // props: { [key: string]: any };
}

// 他のグローバル変数の宣言
declare var LZString: any;
