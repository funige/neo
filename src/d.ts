// 1. まず「Neo」という名前のインターフェースを定義し、それを拡張可能にする
// interface NeoInterface {
//   [key: string]: unknown;
// }

// 2. グローバル変数「Neo」として宣言する
// これにより「Neo」という変数名が使えるようになり、型は上記のインターフェースに従う
// declare var Neo: NeoInterface;

// 3. 他のグローバル変数の宣言
declare var LZString: typeof import("lz-string");


