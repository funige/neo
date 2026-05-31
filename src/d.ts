// 1. インスタンスの形（動的プロパティ）を定義
interface DynamicProps {
    [key: string]: any;
}

// 2. コンストラクターとしてのシグネチャを定義
interface Constructor {
    new (...args: any[]): any;
}
// 3. グローバル変数「Neo」を型として宣言
declare var Neo: AnyFlexibleInterface & {
    [key: string]: any;
};

// 4. 'oe' が出現した際、自動的に Neo.Painter 型として扱う。
declare var oe: Neo.Painter;
// 5. 'painter' が出現した際、自動的に Neo.Painter 型として扱う。
declare namespace Neo {
    let painter: Neo.Painter;
}
// 6. ライブラリを追加
declare var LZString: any;
