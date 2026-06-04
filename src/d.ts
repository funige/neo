// 1. まず「Neo」という名前のインターフェースを定義し、それを拡張可能にする
interface NeoInterface {
    [key: string]: any;
    painter: any; // 必要に応じて具体的な型に置き換え
    props: { [key: string]: any };
}

// 2. グローバル変数「Neo」として宣言する
// これにより「Neo」という変数名が使えるようになり、型は上記のインターフェースに従う
declare var Neo: NeoInterface;

// 3. 他のグローバル変数の宣言
declare var oe: any; // Painter型を別途定義しているならそれに置き換え
declare var LZString: any;