// 1. Neoの型を定義
interface AnyFlexibleInterface {
    [key: string]: any;
    new (...args: any[]): any;
}
// 2. グローバル変数「Neo」を型として宣言
declare var Neo: AnyFlexibleInterface & {
    [key: string]: any;
};
// 3. ライブラリを追加
declare var LZString: any;