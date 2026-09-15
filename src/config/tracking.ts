/**
 * 計測タグの設定。IDやラベルを変える時はこのファイルだけを触る。
 *
 * Google広告のコンバージョンラベルは
 *   Google広告 → 目標 → コンバージョン → 該当アクション → 「タグを設定する」→「タグを自分で追加する」
 * の画面に出る `AW-XXXXXXXXX/ラベル` の後半部分。
 */

/** Google広告アカウント 7168711854（山形）のタグID */
export const GOOGLE_ADS_ID = "AW-10979547512";

/**
 * コンバージョンアクションのラベル。3本とも「1クリック＝1CV」の設定。
 *  - tel  : ID 997199468（電話タップ）
 *  - line : ID 997199471（LINEタップ）
 *  - form : ID 997199474（フォーム送信）
 */
export const ADS_CONVERSION_LABELS = {
	tel: "-4iCCOycwNsDEPiyuvMo",
	line: "V9GECO-cwNsDEPiyuvMo",
	form: "_DjNCPKcwNsDEPiyuvMo",
} as const;

/**
 * GA4の測定ID（G-XXXXXXXXXX）。
 * GA4プロパティ「山形不用品回収サービス」の 管理 → データストリーム → ウェブ → 測定ID から取得して入れる。
 * 空のままだとGA4は読み込まれない（Google広告のコンバージョンは動く）。
 */
export const GA4_MEASUREMENT_ID = "";

/** Microsoft Clarity のプロジェクトID */
export const CLARITY_ID = "yhmctq29h3";
