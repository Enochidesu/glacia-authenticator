'use strict';
// English source messages are shared by the renderer, native dialogs and tray.
// Placeholder values remain data; translation never treats them as HTML.
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GlaciaI18n=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
const languages=['en','id','ja'];
const normalizeLanguage=value=>languages.includes(value)?value:'en';
const catalog=Object.create(null);
const messages=`
Updates are not available yet. Try again later.|Pembaruan belum tersedia. Coba lagi nanti.|更新はまだ利用できません。後でもう一度お試しください。
App updates|Pembaruan aplikasi|アプリの更新
Check for updates|Periksa pembaruan|更新を確認
Check when Glacia starts|Periksa saat Glacia dimulai|Glacia 起動時に確認
Checks after a fresh launch, without downloading automatically.|Memeriksa saat aplikasi baru dibuka, tanpa mengunduh otomatis.|アプリの新しい起動時に確認します。自動ダウンロードは行いません。
Include pre-release updates|Sertakan pembaruan prarilis|プレリリースの更新を含める
Receive testing versions as well as stable releases.|Terima versi pengujian selain rilis stabil.|安定版に加えてテスト版も受け取ります。
Checks GitHub for a newer version of Glacia.|Memeriksa versi Glacia yang lebih baru di GitHub.|GitHub で Glacia の新しいバージョンを確認します。
Checking for updates…|Memeriksa pembaruan…|更新を確認中…
You have the latest available version.|Anda menggunakan versi terbaru yang tersedia.|利用可能な最新バージョンです。
A new update is available.|Pembaruan baru tersedia.|新しい更新があります。
Downloading update…|Mengunduh pembaruan…|更新をダウンロード中…
Your update is ready.|Pembaruan siap dipasang.|更新の準備ができました。
Restarting Glacia to install the update…|Memulai ulang Glacia untuk memasang pembaruan…|更新をインストールするため Glacia を再起動中…
Current version:|Versi saat ini:|現在のバージョン：
New version:|Versi baru:|新しいバージョン：
Glacia will download the update, then ask you to restart. Your vault and settings will be kept.|Glacia akan mengunduh pembaruan, lalu meminta Anda memulai ulang. Brankas dan pengaturan Anda tetap tersimpan.|Glacia は更新をダウンロードした後、再起動を確認します。保管庫と設定は保持されます。
Update|Perbarui|更新
Remind me later|Ingatkan nanti|後で通知
Cancel download|Batalkan unduhan|ダウンロードを中止
Download progress|Progres unduhan|ダウンロードの進行状況
Restart & update|Mulai ulang & perbarui|再起動して更新
Restart Glacia to finish installing the update.|Mulai ulang Glacia untuk menyelesaikan pemasangan pembaruan.|Glacia を再起動して更新のインストールを完了してください。
Finishing current work before restarting.|Menyelesaikan pekerjaan saat ini sebelum memulai ulang.|再起動前に現在の処理を完了しています。
Update could not be completed.|Pembaruan tidak dapat diselesaikan.|更新を完了できませんでした。
Try again|Coba lagi|再試行
Could not complete the update. Check your internet connection and try again.|Pembaruan tidak dapat diselesaikan. Periksa koneksi internet Anda dan coba lagi.|更新を完了できませんでした。インターネット接続を確認して再試行してください。
Update checks are available in the packaged Windows app.|Pemeriksaan pembaruan tersedia di aplikasi Windows yang dikemas.|更新の確認は配布用 Windows アプリで利用できます。
Install Glacia with its installer to enable automatic installation.|Pasang Glacia menggunakan installer agar pemasangan pembaruan otomatis tersedia.|自動インストールを有効にするには、インストーラーで Glacia をインストールしてください。
Wait for the current update operation to finish.|Tunggu hingga proses pembaruan saat ini selesai.|現在の更新処理が完了するまでお待ちください。
Invalid update preference.|Pengaturan pembaruan tidak valid.|更新の設定が無効です。
Could not save update preferences.|Pengaturan pembaruan tidak dapat disimpan.|更新の設定を保存できませんでした。
Invalid update action.|Tindakan pembaruan tidak valid.|更新の操作が無効です。
Check for an update before downloading.|Periksa pembaruan sebelum mengunduh.|ダウンロード前に更新を確認してください。
No cancellable update download is running.|Tidak ada unduhan pembaruan yang dapat dibatalkan.|中止できる更新ダウンロードは実行されていません。
Download the update before installing.|Unduh pembaruan sebelum memasang.|インストール前に更新をダウンロードしてください。
Privacy policy|Kebijakan privasi|プライバシーポリシー
Google sign-in uses your email and Glacia’s private Drive app data for encrypted sync. Local-only use is optional.|Login Google menggunakan email Anda dan data aplikasi Drive khusus Glacia untuk sinkronisasi terenkripsi. Anda juga dapat menggunakan brankas lokal saja.|Google サインインでは、メールアドレスと Glacia 専用の Drive アプリデータを暗号化同期に使用します。ローカルのみでも利用できます。
This information page is unavailable.|Halaman informasi ini tidak tersedia.|この情報ページは利用できません。
Language|Bahasa|言語
Changes immediately. No restart needed.|Langsung berubah. Tidak perlu memulai ulang.|すぐに切り替わります。再起動は不要です。
LOCAL VAULT|BRANKAS LOKAL|ローカル保管庫
AUTHENTICATOR|AUTENTIKATOR|認証アプリ
YOUR SPACE|RUANG ANDA|あなたのスペース
All accounts|Semua akun|すべてのアカウント
Favorites|Favorit|お気に入り
FOLDERS|FOLDER|フォルダー
Personal|Pribadi|個人用
Work|Kerja|仕事用
TOOLS|ALAT|ツール
Tools|Alat|ツール
Add authenticator|Tambah autentikator|認証キーを追加
Import / Export|Impor / Ekspor|インポート / エクスポート
Google sync|Sinkronisasi Google|Google 同期
Settings|Pengaturan|設定
Sign Out|Keluar|サインアウト
Sign out of Google and lock your vault|Keluar dari Google dan kunci brankas Anda|Google からサインアウトして保管庫をロック
A little calm, every sign-in.|Sedikit ketenangan, setiap kali masuk.|ログインのたびに、少しの安らぎを。
My Glacia|Glacia Saya|マイ Glacia
Accounts|Akun|アカウント
Snow light|Cahaya salju|スノーライト
Polar night|Malam kutub|ポーラーナイト
Dark mode|Mode gelap|ダークモード
Lock vault|Kunci brankas|保管庫をロック
Encrypted local vault|Brankas lokal terenkripsi|暗号化されたローカル保管庫
Glacia Auth. · a softer kind of security|Glacia Auth. · keamanan yang lebih menenangkan|Glacia Auth. · やさしいセキュリティ
Created by Enochi Sasaina|Dibuat oleh Enochi Sasaina|Enochi Sasaina 制作
Created by|Dibuat oleh|制作者：
Window controls|Kontrol jendela|ウィンドウ操作
Minimize|Minimalkan|最小化
Maximize|Maksimalkan|最大化
Restore|Pulihkan|元のサイズに戻す
Close|Tutup|閉じる
Main menu|Menu utama|メインメニュー
Accounts navigation|Navigasi akun|アカウントのナビゲーション
Account folders|Folder akun|アカウントのフォルダー
Glacia Authenticator design|Tampilan Glacia Authenticator|Glacia Authenticator の画面
LESS RUSH. MORE HUSH.|LEBIH TENANG. LEBIH NYAMAN.|あわただしさを減らし、静けさを。
Your accounts|Akun Anda|あなたのアカウント
Everything you need for your next sign-in.|Semua yang Anda perlukan untuk masuk berikutnya.|次のログインに必要なものを、ここに。
Your favorites|Favorit Anda|あなたのお気に入り
The accounts you reach for most.|Akun yang paling sering Anda gunakan.|よく使うアカウントを、すぐ手元に。
Personal accounts|Akun pribadi|個人用アカウント
A little space for your everyday world.|Ruang kecil untuk keseharian Anda.|毎日のための、小さなスペース。
Work accounts|Akun kerja|仕事用アカウント
Keep your working world together.|Simpan akun kerja Anda di satu tempat.|仕事のアカウントを、ひとつの場所に。
Import & export|Impor & ekspor|インポートとエクスポート
Bring your accounts home. Take a backup with you.|Satukan akun Anda. Simpan cadangannya.|アカウントをここに。バックアップを手元に。
Your winter, wherever you sign in.|Ketenangan Anda, di mana pun Anda masuk.|どこでログインしても、あなたの冬を。
Make it yours|Sesuaikan untuk Anda|あなたらしく
Small details. Your kind of calm.|Detail kecil. Ketenangan pilihan Anda.|小さな工夫で、あなた好みの安らぎを。
Find an account…|Cari akun…|アカウントを検索…
Search accounts|Cari akun|アカウントを検索
Authentication codes|Kode autentikasi|認証コード
30s cycle|Siklus 30 dtk|30秒周期
No matching accounts.|Tidak ada akun yang cocok.|一致するアカウントがありません。
Try a different search or folder.|Coba pencarian atau folder lain.|別の検索語やフォルダーをお試しください。
Your winter starts here.|Ketenangan Anda dimulai di sini.|あなたの冬は、ここから。
Add an authenticator or import your accounts.|Tambah autentikator atau impor akun Anda.|認証キーを追加するか、アカウントをインポートしてください。
Your own little winter.|Ketenangan kecil milik Anda.|あなただけの、小さな冬。
Appearance|Tampilan|外観
Snow light by day. Polar night after dark.|Cahaya salju di siang hari. Malam kutub saat gelap.|昼はスノーライト。夜はポーラーナイト。
Account layout|Tata letak akun|アカウントの表示
Roomy cards or a more compact list.|Kartu lapang atau daftar yang lebih ringkas.|ゆったりしたカード、またはコンパクトな一覧。
Comfortable cards|Kartu nyaman|ゆったりしたカード
Compact list|Daftar ringkas|コンパクトな一覧
Start with Windows|Jalankan saat Windows dimulai|Windows 起動時に開く
Open Glacia automatically when you sign in to Windows.|Buka Glacia secara otomatis saat Anda masuk ke Windows.|Windows へのサインイン時に Glacia を自動的に開きます。
On|Aktif|オン
Off|Nonaktif|オフ
OFF|NONAKTIF|オフ
Automatic lock|Kunci otomatis|自動ロック
Windows lock or sleep still locks your vault.|Brankas tetap terkunci saat Windows dikunci atau masuk mode tidur.|Windows のロック時やスリープ時には、保管庫もロックされます。
After 1 minute|Setelah 1 menit|1分後
After 5 minutes|Setelah 5 menit|5分後
After 15 minutes|Setelah 15 menit|15分後
Never|Tidak pernah|しない
Keep me logged in|Tetap masuk|ログイン状態を保持
Saved on this PC. Idle lock is paused; Windows lock still protects your vault.|Tersimpan di PC ini. Kunci saat tidak aktif dijeda; kunci Windows tetap melindungi brankas Anda.|この PC に保存されています。無操作時のロックは停止していますが、Windows のロック時には保管庫を保護します。
Off. Enable it when unlocking your vault.|Nonaktif. Aktifkan saat membuka kunci brankas.|オフです。保管庫のロックを解除する際に有効にできます。
Forget saved login|Hapus login tersimpan|保存したログイン情報を削除
About Glacia|Tentang Glacia|Glacia について
Glacia Authenticator is a Windows app for your two-step verification codes. It keeps your keys in an encrypted local vault, works offline, and supports optional encrypted Google sync across your computers.|Glacia Authenticator adalah aplikasi Windows untuk kode verifikasi dua langkah Anda. Kunci disimpan dalam brankas lokal terenkripsi, dapat digunakan secara offline, dan mendukung sinkronisasi Google terenkripsi antar-PC sebagai pilihan.|Glacia Authenticator は、2段階認証コードを管理する Windows アプリです。認証キーを暗号化されたローカル保管庫に保存し、オフラインでも使えます。必要に応じて、Google 経由で複数の PC 間を暗号化して同期できます。
Windows desktop · version 0.5.0|Desktop Windows · versi 0.5.0|Windows デスクトップ · バージョン 0.5.0
Your accounts are encrypted before uploading to Glacia’s private Google Drive app data. Keep the same sync password on every computer.|Akun dienkripsi sebelum diunggah ke data aplikasi pribadi Glacia di Google Drive. Gunakan kata sandi sinkronisasi yang sama di setiap PC.|アカウントは暗号化してから、Google Drive の Glacia 専用アプリデータ領域にアップロードされます。すべての PC で同じ同期パスワードを使ってください。
Waiting for Google sign-in|Menunggu login Google|Google サインインを待っています
Not connected|Belum terhubung|未接続
Syncing your encrypted vault|Menyinkronkan brankas terenkripsi|暗号化された保管庫を同期中
Automatic sync is on|Sinkronisasi otomatis aktif|自動同期はオンです
Sync paused|Sinkronisasi dijeda|同期は一時停止中です
Connect your Google account to carry your accounts between Glacia computers.|Hubungkan akun Google untuk membawa akun Anda ke PC lain dengan Glacia.|Google アカウントを接続すると、Glacia を使う PC 間でアカウントを同期できます。
Last synced: {date}|Terakhir disinkronkan: {date}|最終同期：{date}
Google sign-in is unavailable in this build.|Login Google tidak tersedia pada versi ini.|このビルドでは Google サインインを利用できません。
Cancel sign-in|Batalkan login|サインインをキャンセル
Sign in with Google|Masuk dengan Google|Google でサインイン
Sync now|Sinkronkan sekarang|今すぐ同期
Pause sync|Jeda sinkronisasi|同期を一時停止
Unlock sync|Buka kunci sinkronisasi|同期のロックを解除
Disconnect Google|Putuskan Google|Google の接続を解除
Encrypted on every computer|Terenkripsi di setiap PC|すべての PC で暗号化
Sync runs while Glacia is open, unlocked, and online. Locking clears the sync password from memory.|Sinkronisasi berjalan saat Glacia terbuka, brankas tidak terkunci, dan online. Mengunci brankas menghapus kata sandi sinkronisasi dari memori.|Glacia が開いていて、ロックが解除され、オンラインの間に同期します。ロックすると同期パスワードはメモリから消去されます。
Keep an independent backup|Simpan cadangan terpisah|別途バックアップを保管
Google sign-in alone cannot decrypt your vault. Your sync password is needed to restore it.|Login Google saja tidak dapat membuka enkripsi brankas. Kata sandi sinkronisasi diperlukan untuk memulihkannya.|Google へのサインインだけでは保管庫を復号できません。復元には同期パスワードが必要です。
Google sync connects Glacia computers. Use Send to phone for Google Authenticator.|Sinkronisasi Google menghubungkan PC dengan Glacia. Gunakan Kirim ke ponsel untuk Google Authenticator.|Google 同期は Glacia を使う PC 同士をつなぎます。Google Authenticator へは「スマートフォンに送る」を使ってください。
Unlock your cloud vault|Buka kunci brankas cloud|クラウド保管庫のロックを解除
Choose a sync password the first time. On another computer, enter that same password to restore your accounts.|Pilih kata sandi sinkronisasi saat pertama kali. Di PC lain, masukkan kata sandi yang sama untuk memulihkan akun.|初回は同期パスワードを設定してください。別の PC では同じパスワードを入力してアカウントを復元します。
Sync password|Kata sandi sinkronisasi|同期パスワード
Confirm sync password|Konfirmasi kata sandi sinkronisasi|同期パスワードを確認
At least 12 characters|Minimal 12 karakter|12文字以上
Enter it again|Masukkan lagi|もう一度入力
Your local vault password can be used here if you prefer. Google sign-in cannot recover a forgotten sync password.|Anda dapat menggunakan kata sandi brankas lokal di sini. Login Google tidak dapat memulihkan kata sandi sinkronisasi yang terlupa.|ローカル保管庫と同じパスワードも使えます。忘れた同期パスワードを Google サインインで復旧することはできません。
Unlock and sync|Buka kunci dan sinkronkan|ロックを解除して同期
Disconnect Google?|Putuskan Google?|Google の接続を解除しますか？
This stops sync on this computer and removes its saved Google sign-in. Your local accounts and encrypted Google cloud copies stay available.|Ini menghentikan sinkronisasi di PC ini dan menghapus login Google tersimpan. Akun lokal dan salinan cloud Google terenkripsi tetap tersedia.|この PC の同期を停止し、保存した Google のログイン情報を削除します。ローカルのアカウントと、Google に保存した暗号化済みのコピーは残ります。
Disconnect this computer|Putuskan PC ini|この PC の接続を解除
Delete authenticator?|Hapus autentikator?|認証キーを削除しますか？
Remove|Hapus|削除するアカウント：
from Glacia?|dari Glacia?|Glacia から削除しますか？
You will need its setup key or a backup to add it again. This removal will sync to your other Glacia computers when Google sync is enabled.|Anda memerlukan kunci penyiapan atau cadangan untuk menambahkannya lagi. Penghapusan ini akan disinkronkan ke PC Glacia lain saat sinkronisasi Google aktif.|追加し直すにはセットアップキーまたはバックアップが必要です。Google 同期が有効な場合、この削除はほかの Glacia の PC にも反映されます。
Cancel|Batal|キャンセル
Delete|Hapus|削除
Delete ({seconds}s)|Hapus ({seconds} dtk)|削除（{seconds}秒）
Delete authenticator|Hapus autentikator|認証キーを削除
Reorder {name}|Ubah urutan {name}|{name} の順序を変更
Favorite {name}|Favoritkan {name}|{name} をお気に入りにする
Delete {name}|Hapus {name}|{name} を削除
Copy code for {name}|Salin kode {name}|{name} のコードをコピー
Edit name for {name}|Ubah nama {name}|{name} の名前を編集
Save name for {name}|Simpan nama {name}|{name} の名前を保存
Send {name} to phone|Kirim {name} ke ponsel|{name} をスマートフォンに送る
Folder for {name}|Folder untuk {name}|{name} のフォルダー
Drag to reorder. Alt + Up or Down to move.|Seret untuk mengubah urutan. Alt + Atas atau Bawah untuk memindahkan.|ドラッグで並べ替え。Alt + 上矢印または下矢印でも移動できます。
Account name|Nama akun|アカウント名
Save name|Simpan nama|名前を保存
Edit name|Ubah nama|名前を編集
Moving account|Memindahkan akun|アカウントを移動中
{seconds}s · {period} SEC|{seconds} dtk · {period} DTK|{seconds}秒 · {period}秒周期
Connect an account with its setup key, link, or QR image.|Hubungkan akun dengan kunci penyiapan, tautan, atau gambar QR.|セットアップキー、リンク、または QR 画像でアカウントを追加します。
Add authenticator method|Cara menambah autentikator|認証キーの追加方法
Setup key|Kunci penyiapan|セットアップキー
Setup link|Tautan penyiapan|セットアップリンク
QR image|Gambar QR|QR 画像
Service name|Nama layanan|サービス名
Account label|Label akun|アカウントのラベル
Secret setup key|Kunci rahasia penyiapan|秘密のセットアップキー
Enter the Base32 setup key|Masukkan kunci penyiapan Base32|Base32 のセットアップキーを入力
e.g. Google|mis. Google|例：Google
Email or username|Email atau nama pengguna|メールアドレスまたはユーザー名
Folder|Folder|フォルダー
Advanced settings|Pengaturan lanjutan|詳細設定
Code digits|Jumlah digit kode|コードの桁数
Refresh period (seconds)|Periode pembaruan (detik)|更新間隔（秒）
Algorithm|Algoritma|アルゴリズム
Scan from an image|Pindai dari gambar|画像からスキャン
Choose a PNG, JPG or WebP QR image.|Pilih gambar QR PNG, JPG, atau WebP.|PNG、JPG、WebP の QR 画像を選んでください。
Setup and Google transfer QRs are scanned on this PC.|QR penyiapan dan transfer Google dipindai di PC ini.|セットアップ用と Google 転送用の QR は、この PC 上で読み取ります。
Upload QR image|Unggah gambar QR|QR 画像を読み込む
For Google Authenticator: open Transfer accounts > Export accounts on your phone, select your keys, then upload a clear image of each QR page. These images contain secret keys; keep them private.|Untuk Google Authenticator: buka Transfer akun > Ekspor akun di ponsel, pilih kunci, lalu unggah gambar jelas dari setiap halaman QR. Gambar ini berisi kunci rahasia; jaga kerahasiaannya.|Google Authenticator では、スマートフォンで「アカウントを移行」>「アカウントをエクスポート」を開き、キーを選んで各 QR ページの鮮明な画像を読み込んでください。画像には秘密鍵が含まれるため、他人に見せないでください。
Saved in your encrypted local vault.|Disimpan dalam brankas lokal terenkripsi Anda.|暗号化されたローカル保管庫に保存します。
Your local vault and Glacia backup files are encrypted. Import text links, restore a backup, or send an account to your phone.|Brankas lokal dan file cadangan Glacia Anda terenkripsi. Impor tautan teks, pulihkan cadangan, atau kirim akun ke ponsel.|ローカル保管庫と Glacia のバックアップファイルは暗号化されています。テキストリンクのインポート、バックアップの復元、スマートフォンへの転送ができます。
Import accounts|Impor akun|アカウントをインポート
Open your authenticator .txt file or restore a .winterbell backup.|Buka file autentikator .txt atau pulihkan cadangan .winterbell.|認証アプリの .txt ファイルを開くか、.winterbell バックアップを復元します。
Choose a file|Pilih file|ファイルを選択
Export accounts|Ekspor akun|アカウントをエクスポート
Create an encrypted backup or export setup links for another authenticator.|Buat cadangan terenkripsi atau ekspor tautan penyiapan untuk autentikator lain.|暗号化したバックアップを作成するか、ほかの認証アプリ用のセットアップリンクを書き出します。
Choose format|Pilih format|形式を選択
Scan a QR image|Pindai gambar QR|QR 画像をスキャン
Upload a setup QR screenshot or photo to add an authenticator.|Unggah tangkapan layar atau foto QR penyiapan untuk menambah autentikator.|セットアップ用 QR のスクリーンショットや写真から認証キーを追加します。
Choose QR image|Pilih gambar QR|QR 画像を選択
Send to phone|Kirim ke ponsel|スマートフォンに送る
Create a setup QR for an account, then scan it in Google Authenticator.|Buat QR penyiapan untuk akun, lalu pindai di Google Authenticator.|アカウントのセットアップ用 QR を作成し、Google Authenticator でスキャンします。
Choose an account|Pilih akun|アカウントを選択
Paste authenticator links|Tempel tautan autentikator|認証リンクを貼り付け
Export your accounts.|Ekspor akun Anda.|アカウントを書き出す。
Export format|Format ekspor|エクスポート形式
Encrypted backup|Cadangan terenkripsi|暗号化バックアップ
For another app (.txt)|Untuk aplikasi lain (.txt)|ほかのアプリ用（.txt）
Export all {count} accounts to an encrypted .winterbell file.|Ekspor semua {count} akun ke file .winterbell terenkripsi.|すべての {count} アカウントを、暗号化した .winterbell ファイルに書き出します。
Backup password|Kata sandi cadangan|バックアップのパスワード
Confirm backup password|Konfirmasi kata sandi cadangan|バックアップのパスワードを確認
You’ll need this password to restore the backup on any PC.|Anda memerlukan kata sandi ini untuk memulihkan cadangan di PC mana pun.|どの PC でバックアップを復元する場合も、このパスワードが必要です。
Save encrypted backup|Simpan cadangan terenkripsi|暗号化バックアップを保存
Choose accounts to export as otpauth:// setup links, one per line, for compatible authenticator apps.|Pilih akun untuk diekspor sebagai tautan penyiapan otpauth://, satu per baris, untuk aplikasi autentikator yang kompatibel.|対応する認証アプリ用に、書き出すアカウントを選んでください。otpauth:// セットアップリンクを1行ずつ出力します。
Unencrypted — contains secret setup keys.|Tidak terenkripsi — berisi kunci rahasia penyiapan.|暗号化されません。秘密のセットアップキーが含まれます。
Keep this file private. Anyone with it can generate these accounts’ codes.|Jaga kerahasiaan file ini. Siapa pun yang memilikinya dapat membuat kode akun-akun ini.|このファイルを他人に渡さないでください。持っている人は、これらのアカウントのコードを生成できます。
Export selected accounts (.txt)|Ekspor akun terpilih (.txt)|選択したアカウントを書き出す（.txt）
For phone apps that use QR scanning, use Send to phone.|Untuk aplikasi ponsel yang memakai pemindaian QR, gunakan Kirim ke ponsel.|QR を読み取るスマートフォンアプリには「スマートフォンに送る」を使ってください。
Restore your backup.|Pulihkan cadangan Anda.|バックアップを復元する。
Enter the password used to export it|Masukkan kata sandi saat mengekspornya|エクスポート時のパスワードを入力
Unlock backup|Buka kunci cadangan|バックアップのロックを解除
Bring your accounts home.|Satukan akun Anda.|アカウントをここに。
Existing duplicates will be skipped.|Duplikat yang sudah ada akan dilewati.|既存の重複アカウントはスキップします。
Upload another transfer QR|Unggah QR transfer berikutnya|次の転送用 QR を読み込む
Import selected accounts|Impor akun terpilih|選択したアカウントをインポート
Import authenticator links|Impor tautan autentikator|認証リンクをインポート
Paste one otpauth://totp/ link per line.|Tempel satu tautan otpauth://totp/ per baris.|otpauth://totp/ リンクを1行に1つずつ貼り付けてください。
Authenticator links|Tautan autentikator|認証リンク
Review accounts|Tinjau akun|アカウントを確認
{count} account|{count} akun|{count} アカウント
{count} accounts|{count} akun|{count} アカウント
· {count} account|· {count} akun|· {count} アカウント
· {count} accounts|· {count} akun|· {count} アカウント
· {digits} digits · {period}s|· {digits} digit · {period} dtk|· {digits}桁 · {period}秒
{scanned} of {total} QR pages scanned.|{scanned} dari {total} halaman QR dipindai.|QR を {total} ページ中 {scanned} ページ読み取りました。
Still needed: {pages}.|Masih diperlukan: {pages}.|未読のページ：{pages}。
Send to your phone.|Kirim ke ponsel Anda.|スマートフォンに送る。
Setup QR for the selected authenticator|QR penyiapan untuk autentikator terpilih|選択した認証キーのセットアップ用 QR
In Google Authenticator, tap +, then Scan a QR code. Scan this image to add the same account.|Di Google Authenticator, ketuk +, lalu Pindai kode QR. Pindai gambar ini untuk menambah akun yang sama.|Google Authenticator で「+」、次に「QR コードをスキャン」をタップします。この画像を読み取ると、同じアカウントを追加できます。
This QR contains the account’s secret. Show it only to your own phone.|QR ini berisi kunci rahasia akun. Tampilkan hanya ke ponsel Anda sendiri.|この QR にはアカウントの秘密鍵が含まれます。自分のスマートフォンにだけ見せてください。
Done|Selesai|完了
Choose an account.|Pilih akun.|アカウントを選ぶ。
Create one setup QR at a time.|Buat satu QR penyiapan setiap kali.|セットアップ用 QR を1つずつ作成します。
Welcome to Glacia.|Selamat datang di Glacia.|Glacia へようこそ。
Sign in with Google to back up and restore your Glacia accounts.|Masuk dengan Google untuk mencadangkan dan memulihkan akun Glacia Anda.|Google でサインインすると、Glacia のアカウントをバックアップ、復元できます。
1 · Google sign-in|1 · Login Google|1 · Google サインイン
2 · Choose your starting point|2 · Pilih langkah awal|2 · はじめ方を選ぶ
3 · Protect your vault|3 · Lindungi brankas|3 · 保管庫を保護
Waiting for Google…|Menunggu Google…|Google を待っています…
Google sign-in is unavailable in this build. You can continue with a local vault.|Login Google tidak tersedia pada versi ini. Anda dapat melanjutkan dengan brankas lokal.|このビルドでは Google サインインを利用できません。ローカル保管庫で続けられます。
Bring Google Authenticator keys in through a one-time transfer QR import. Glacia then keeps its own encrypted cloud backup.|Impor kunci Google Authenticator sekali melalui QR transfer. Setelah itu, Glacia menyimpan cadangan cloud terenkripsinya sendiri.|転送用 QR で Google Authenticator のキーを一度インポートします。その後は Glacia が独自の暗号化クラウドバックアップを管理します。
Continue with a local vault|Lanjutkan dengan brankas lokal|ローカル保管庫で続ける
Unlock local vault|Buka kunci brankas lokal|ローカル保管庫のロックを解除
Your vault, your starting point.|Brankas Anda, langkah awal Anda.|あなたの保管庫、あなたのはじめ方。
Signed in as {email}|Masuk sebagai {email}|{email} でサインイン中
Restore a local backup|Pulihkan cadangan lokal|ローカルバックアップを復元
Import a backup file, then sync it to a new cloud vault.|Impor file cadangan, lalu sinkronkan ke brankas cloud baru.|バックアップファイルをインポートし、新しいクラウド保管庫に同期します。
Restore a Glacia cloud backup|Pulihkan cadangan cloud Glacia|Glacia のクラウドバックアップを復元
Bring back a vault you already synced with this Google account.|Pulihkan brankas yang sudah disinkronkan dengan akun Google ini.|この Google アカウントで同期済みの保管庫を復元します。
Start a new synced vault|Buat brankas tersinkronisasi baru|新しい同期保管庫を作成
Start empty, then add keys or import Google Authenticator transfer QRs.|Mulai dari kosong, lalu tambah kunci atau impor QR transfer Google Authenticator.|空の状態から始め、キーを追加するか Google Authenticator の転送用 QR をインポートします。
Use another Google account|Gunakan akun Google lain|別の Google アカウントを使う
A moment of quiet.|Sejenak tenang.|静かなひととき。
Protect your Glacia vault.|Lindungi brankas Glacia Anda.|Glacia の保管庫を保護する。
Unlock your accounts on this PC.|Buka kunci akun Anda di PC ini.|この PC のアカウントのロックを解除します。
Choose a password to protect your local authenticator vault.|Pilih kata sandi untuk melindungi brankas autentikator lokal Anda.|ローカルの認証保管庫を保護するパスワードを設定してください。
Unlock on this PC|Buka kunci di PC ini|この PC でロックを解除
Your login is saved with Windows. You can also enter your password below.|Login Anda disimpan dengan perlindungan Windows. Anda juga dapat memasukkan kata sandi di bawah.|ログイン情報は Windows で保護して保存されています。下にパスワードを入力することもできます。
Vault password|Kata sandi brankas|保管庫のパスワード
Create vault password|Buat kata sandi brankas|保管庫のパスワードを作成
Your vault password|Kata sandi brankas Anda|保管庫のパスワード
At least 6 characters|Minimal 6 karakter|6文字以上
Confirm vault password|Konfirmasi kata sandi brankas|保管庫のパスワードを確認
Cloud backup|Cadangan cloud|クラウドバックアップ
Cloud vault name|Nama brankas cloud|クラウド保管庫の名前
Existing sync password|Kata sandi sinkronisasi yang ada|既存の同期パスワード
Create sync password|Buat kata sandi sinkronisasi|同期パスワードを作成
Use the same sync password you set on your other Glacia computer. Your local vault password can be different.|Gunakan kata sandi sinkronisasi yang sama dengan PC Glacia lainnya. Kata sandi brankas lokal boleh berbeda.|ほかの Glacia の PC で設定した同期パスワードを使ってください。ローカル保管庫のパスワードは別でも構いません。
Your new cloud vault starts separately from any older backups. Your local vault password can be different.|Brankas cloud baru dimulai terpisah dari cadangan lama. Kata sandi brankas lokal boleh berbeda.|新しいクラウド保管庫は以前のバックアップとは別に作成されます。ローカル保管庫のパスワードは別でも構いません。
Keep me logged in on this PC|Tetap masuk di PC ini|この PC でログイン状態を保持
Windows protects your saved login. Lock requires your vault password; Sign Out also signs out of Google.|Windows melindungi login tersimpan. Kunci memerlukan kata sandi brankas; Keluar juga mengeluarkan akun Google.|保存したログイン情報は Windows が保護します。ロックの解除には保管庫のパスワードが必要です。サインアウトすると Google からもサインアウトします。
Unlock Glacia|Buka kunci Glacia|Glacia のロックを解除
Create vault & restore accounts|Buat brankas & pulihkan akun|保管庫を作成してアカウントを復元
Create vault & choose backup|Buat brankas & pilih cadangan|保管庫を作成してバックアップを選択
Create my synced vault|Buat brankas tersinkronisasi saya|同期保管庫を作成
Create my vault|Buat brankas saya|保管庫を作成
Keep your passwords somewhere safe. Google sign-in cannot recover your sync password.|Simpan kata sandi di tempat aman. Login Google tidak dapat memulihkan kata sandi sinkronisasi.|パスワードは安全な場所に保管してください。Google サインインでは同期パスワードを復旧できません。
Back to choices|Kembali ke pilihan|選択画面に戻る
Back to Google sign-in|Kembali ke login Google|Google サインインに戻る
Signed in with Google: {email}|Masuk dengan Google: {email}|Google でサインイン中：{email}
Account order saved.|Urutan akun disimpan.|アカウントの順序を保存しました。
Folder updated.|Folder diperbarui.|フォルダーを変更しました。
Name updated.|Nama diperbarui.|名前を変更しました。
Authenticator added.|Autentikator ditambahkan.|認証キーを追加しました。
Authenticator deleted.|Autentikator dihapus.|認証キーを削除しました。
Saved login forgotten.|Login tersimpan dihapus.|保存したログイン情報を削除しました。
Glacia will start with Windows.|Glacia akan berjalan saat Windows dimulai.|Windows 起動時に Glacia を開きます。
Windows startup turned off.|Jalankan saat Windows dimulai dinonaktifkan.|Windows 起動時の自動起動をオフにしました。
Code copied. Clipboard clears after 30 seconds.|Kode disalin. Papan klip dibersihkan setelah 30 detik.|コードをコピーしました。30秒後にクリップボードを消去します。
Sync complete.|Sinkronisasi selesai.|同期が完了しました。
Your encrypted vault is synced.|Brankas terenkripsi Anda disinkronkan.|暗号化された保管庫を同期しました。
Your Glacia cloud accounts are restored.|Akun cloud Glacia Anda dipulihkan.|Glacia のクラウドアカウントを復元しました。
Vault ready. Import your file or add an authenticator.|Brankas siap. Impor file atau tambah autentikator.|保管庫の準備ができました。ファイルをインポートするか認証キーを追加してください。
Add an account before exporting a backup.|Tambah akun sebelum mengekspor cadangan.|バックアップを書き出す前にアカウントを追加してください。
Add an account before exporting.|Tambah akun sebelum mengekspor.|書き出す前にアカウントを追加してください。
Add an account before sending it to a phone.|Tambah akun sebelum mengirimnya ke ponsel.|スマートフォンに送る前にアカウントを追加してください。
Drag to move this account, or use Alt + Up or Down.|Seret untuk memindahkan akun ini, atau gunakan Alt + Atas atau Bawah.|ドラッグ、または Alt + 上矢印・下矢印でこのアカウントを移動できます。
Enter an account name.|Masukkan nama akun.|アカウント名を入力してください。
Portable .txt saved: {count} account.|File .txt portabel disimpan: {count} akun.|移行用 .txt を保存しました：{count} アカウント。
Portable .txt saved: {count} accounts.|File .txt portabel disimpan: {count} akun.|移行用 .txt を保存しました：{count} アカウント。
Encrypted backup saved: {count} accounts.|Cadangan terenkripsi disimpan: {count} akun.|暗号化バックアップを保存しました：{count} アカウント。
{count} account imported.|{count} akun diimpor.|{count} アカウントをインポートしました。
{count} accounts imported.|{count} akun diimpor.|{count} アカウントをインポートしました。
{count} account imported; {skipped} duplicate skipped.|{count} akun diimpor; {skipped} duplikat dilewati.|{count} アカウントをインポートし、{skipped} 件の重複をスキップしました。
{count} accounts imported; {skipped} duplicates skipped.|{count} akun diimpor; {skipped} duplikat dilewati.|{count} アカウントをインポートし、{skipped} 件の重複をスキップしました。
{count} account imported; {skipped} duplicates skipped.|{count} akun diimpor; {skipped} duplikat dilewati.|{count} アカウントをインポートし、{skipped} 件の重複をスキップしました。
{count} accounts imported; {skipped} duplicate skipped.|{count} akun diimpor; {skipped} duplikat dilewati.|{count} アカウントをインポートし、{skipped} 件の重複をスキップしました。
Open Glacia|Buka Glacia|Glacia を開く
Exit|Keluar aplikasi|終了
Choose authenticator|Pilih autentikator|認証キーを選択
Close mini panel|Tutup panel mini|ミニパネルを閉じる
Copy code|Salin kode|コードをコピー
Time remaining|Waktu tersisa|残り時間
Open Glacia to unlock your vault.|Buka Glacia untuk membuka kunci brankas.|Glacia を開いて保管庫のロックを解除してください。
Add an authenticator in Glacia to see it here.|Tambah autentikator di Glacia untuk menampilkannya di sini.|Glacia で認証キーを追加すると、ここに表示されます。
Open Glacia to reconnect.|Buka Glacia untuk menghubungkan kembali.|Glacia を開いて再接続してください。
Copied|Disalin|コピーしました
{seconds}s remaining|Sisa {seconds} dtk|残り {seconds}秒
Available in the Windows app.|Tersedia di aplikasi Windows.|Windows アプリで利用できます。
Windows startup settings could not be read. Try opening Glacia again.|Pengaturan startup Windows tidak dapat dibaca. Coba buka Glacia lagi.|Windows の起動設定を読み取れませんでした。Glacia を開き直してください。
Choose whether Glacia should start with Windows.|Pilih apakah Glacia dijalankan saat Windows dimulai.|Windows 起動時に Glacia を開くか選んでください。
Startup is available in the Windows app.|Startup tersedia di aplikasi Windows.|自動起動は Windows アプリで利用できます。
Windows did not change this setting. Check Glacia in Windows Startup apps.|Windows tidak mengubah pengaturan ini. Periksa Glacia di Aplikasi startup Windows.|Windows で設定を変更できませんでした。Windows のスタートアップ アプリで Glacia を確認してください。
Import authenticators or restore a Glacia backup|Impor autentikator atau pulihkan cadangan Glacia|認証キーをインポート、または Glacia バックアップを復元
Authenticator links and Glacia backups|Tautan autentikator dan cadangan Glacia|認証リンクと Glacia バックアップ
Export unencrypted authenticator links|Ekspor tautan autentikator tanpa enkripsi|暗号化せずに認証リンクを書き出す
Plain-text authenticator links (contains secret keys)|Tautan autentikator teks biasa (berisi kunci rahasia)|テキスト形式の認証リンク（秘密鍵を含む）
Encrypted Glacia backup|Cadangan Glacia terenkripsi|暗号化 Glacia バックアップ
Choose a setup QR image|Pilih gambar QR penyiapan|セットアップ用 QR 画像を選択
The vault passwords do not match.|Kata sandi brankas tidak cocok.|保管庫のパスワードが一致しません。
The backup passwords do not match.|Kata sandi cadangan tidak cocok.|バックアップのパスワードが一致しません。
No Glacia cloud backups were found. Restore a local backup or start a new vault.|Tidak ditemukan cadangan cloud Glacia. Pulihkan cadangan lokal atau buat brankas baru.|Glacia のクラウドバックアップが見つかりません。ローカルバックアップを復元するか、新しい保管庫を作成してください。
The QR image dimensions are too large.|Ukuran gambar QR terlalu besar.|QR 画像の解像度が大きすぎます。
No readable QR code found. Try a sharper image or use the setup key.|Tidak ditemukan kode QR yang dapat dibaca. Coba gambar lebih tajam atau gunakan kunci penyiapan.|読み取れる QR コードが見つかりません。鮮明な画像、またはセットアップキーを使ってください。
Unlock Glacia first.|Buka kunci Glacia terlebih dahulu.|先に Glacia のロックを解除してください。
Enter your vault password.|Masukkan kata sandi brankas.|保管庫のパスワードを入力してください。
The vault was locked. Try again.|Brankas dikunci. Coba lagi.|保管庫がロックされました。もう一度お試しください。
Account not found.|Akun tidak ditemukan.|アカウントが見つかりません。
The file is too large.|File terlalu besar.|ファイルが大きすぎます。
QR images must be smaller than 10 MB.|Gambar QR harus lebih kecil dari 10 MB.|QR 画像は10 MB未満にしてください。
Request denied.|Permintaan ditolak.|リクエストが拒否されました。
The operation could not be completed.|Operasi tidak dapat diselesaikan.|操作を完了できませんでした。
Unlock Glacia and enable sync again.|Buka kunci Glacia dan aktifkan sinkronisasi lagi.|Glacia のロックを解除して、同期を再度有効にしてください。
Saved login no longer matches this vault.|Login tersimpan tidak lagi cocok dengan brankas ini.|保存したログイン情報がこの保管庫と一致しません。
Setup was locked. Unlock your newly created vault to continue.|Penyiapan dikunci. Buka kunci brankas yang baru dibuat untuk melanjutkan.|設定中にロックされました。作成した保管庫のロックを解除して続けてください。
Use a password of at least {count} characters.|Gunakan kata sandi minimal {count} karakter.|{count}文字以上のパスワードを使ってください。
Last synced:|Terakhir disinkronkan:|最終同期：
Close dialog|Tutup dialog|ダイアログを閉じる
{seconds}s|{seconds} dtk|{seconds}秒
Enter a valid service and account label.|Masukkan nama layanan dan label akun yang valid.|有効なサービス名とアカウントのラベルを入力してください。
The setup key must use Base32 letters A–Z and numbers 2–7.|Kunci penyiapan harus memakai huruf Base32 A–Z dan angka 2–7.|セットアップキーには Base32 の英字 A–Z と数字 2–7 を使ってください。
The setup key has an invalid length.|Panjang kunci penyiapan tidak valid.|セットアップキーの長さが無効です。
The setup key has invalid Base32 padding.|Padding Base32 pada kunci penyiapan tidak valid.|セットアップキーの Base32 パディングが無効です。
Invalid authenticator record.|Data autentikator tidak valid.|認証キーのデータが無効です。
Supported algorithms are SHA1, SHA256 and SHA512.|Algoritma yang didukung adalah SHA1, SHA256, dan SHA512.|対応するアルゴリズムは SHA1、SHA256、SHA512 です。
Codes must have 6 or 8 digits.|Kode harus memiliki 6 atau 8 digit.|コードは6桁または8桁にしてください。
The refresh period must be between 1 and 3600 seconds.|Periode pembaruan harus antara 1 dan 3600 detik.|更新間隔は1～3600秒にしてください。
Enter a valid otpauth://totp/ link.|Masukkan tautan otpauth://totp/ yang valid.|有効な otpauth://totp/ リンクを入力してください。
Use QR image upload to import Google Authenticator transfer codes.|Gunakan unggah gambar QR untuk mengimpor kode transfer Google Authenticator.|Google Authenticator の転送コードは QR 画像からインポートしてください。
Only time-based otpauth://totp/ authenticators are supported.|Hanya autentikator berbasis waktu otpauth://totp/ yang didukung.|時間ベースの otpauth://totp/ 認証キーのみ対応しています。
The authenticator link is malformed.|Format tautan autentikator salah.|認証リンクの形式が不正です。
The authenticator link contains repeated settings.|Tautan autentikator berisi pengaturan berulang.|認証リンクに重複した設定が含まれています。
The account label is not encoded correctly.|Label akun tidak dikodekan dengan benar.|アカウントのラベルが正しくエンコードされていません。
The service name in the label and issuer does not match.|Nama layanan pada label dan penerbit tidak cocok.|ラベルと発行元のサービス名が一致しません。
Import files must be smaller than 1 MB.|File impor harus lebih kecil dari 1 MB.|インポートファイルは1 MB未満にしてください。
Choose a file with 1–2000 authenticator links.|Pilih file berisi 1–2000 tautan autentikator.|1～2000件の認証リンクを含むファイルを選んでください。
Invalid import.|Impor tidak valid.|インポートデータが無効です。
A vault can contain up to 2000 accounts.|Brankas dapat memuat hingga 2000 akun.|保管庫には最大2000件のアカウントを保存できます。
Invalid account order.|Urutan akun tidak valid.|アカウントの順序が無効です。
Invalid account deletion history.|Riwayat penghapusan akun tidak valid.|アカウントの削除履歴が無効です。
Account deletion history is full.|Riwayat penghapusan akun penuh.|アカウントの削除履歴がいっぱいです。
Select at least one account to export.|Pilih minimal satu akun untuk diekspor.|書き出すアカウントを1つ以上選んでください。
Invalid or oversized backup file.|File cadangan tidak valid atau terlalu besar.|バックアップファイルが無効、または大きすぎます。
Choose a valid Glacia backup file.|Pilih file cadangan Glacia yang valid.|有効な Glacia バックアップファイルを選んでください。
This backup format is not supported.|Format cadangan ini tidak didukung.|このバックアップ形式には対応していません。
The backup file is damaged.|File cadangan rusak.|バックアップファイルが破損しています。
Invalid backup contents.|Isi cadangan tidak valid.|バックアップの内容が無効です。
Incorrect password, or the backup file is damaged.|Kata sandi salah, atau file cadangan rusak.|パスワードが違うか、バックアップファイルが破損しています。
Enter the backup password.|Masukkan kata sandi cadangan.|バックアップのパスワードを入力してください。
Line {line}: {message}|Baris {line}: {message}|{line}行目：{message}
The combined vault exceeds 2000 accounts. Export a backup before reorganizing it.|Brankas gabungan melebihi 2000 akun. Ekspor cadangan sebelum mengatur ulang.|統合後の保管庫が2000件を超えます。整理する前にバックアップを書き出してください。
Cloud data is too large.|Data cloud terlalu besar.|クラウドデータが大きすぎます。
Windows secure token storage is unavailable.|Penyimpanan token aman Windows tidak tersedia.|Windows の安全なトークン保存機能を利用できません。
Cancel Google sign-in first.|Batalkan login Google terlebih dahulu.|先に Google サインインをキャンセルしてください。
Google sign-in expired. Disconnect and sign in again.|Login Google kedaluwarsa. Putuskan koneksi dan masuk lagi.|Google サインインの有効期限が切れました。接続を解除してサインインし直してください。
Google did not allow syncing. Try signing in again. If this continues, contact Glacia support.|Google tidak mengizinkan sinkronisasi. Coba masuk lagi. Jika berlanjut, hubungi dukungan Glacia.|Google に同期が許可されませんでした。サインインし直してください。続く場合は Glacia サポートにお問い合わせください。
Google request failed ({status}). Try syncing again.|Permintaan Google gagal ({status}). Coba sinkronkan lagi.|Google へのリクエストが失敗しました（{status}）。同期を再度お試しください。
Google is already connected.|Google sudah terhubung.|Google はすでに接続されています。
Google sign-in was declined.|Login Google ditolak.|Google サインインが拒否されました。
Google sign-in canceled.|Login Google dibatalkan.|Google サインインをキャンセルしました。
Could not open the local sign-in callback.|Tidak dapat membuka penerima login lokal.|ローカルのサインイン受付を開けませんでした。
Google sign-in timed out. Try again.|Waktu login Google habis. Coba lagi.|Google サインインがタイムアウトしました。もう一度お試しください。
Could not open your browser.|Tidak dapat membuka browser.|ブラウザーを開けませんでした。
Google did not grant offline app-data access. Sign in again and allow the requested permission.|Google tidak memberikan akses data aplikasi offline. Masuk lagi dan izinkan akses yang diminta.|Google のオフライン アプリデータへのアクセスが許可されませんでした。サインインし直し、要求された権限を許可してください。
Google account identity could not be verified.|Identitas akun Google tidak dapat diverifikasi.|Google アカウントの本人確認ができませんでした。
Sign in with Google first.|Masuk dengan Google terlebih dahulu.|先に Google でサインインしてください。
Google sign-in needs to be renewed.|Login Google perlu diperbarui.|Google サインインを更新してください。
Invalid Drive response.|Respons Drive tidak valid.|Drive からの応答が無効です。
Too many synced devices. Keep an encrypted backup and review your Google app data.|Terlalu banyak perangkat tersinkronisasi. Simpan cadangan terenkripsi dan periksa data aplikasi Google.|同期デバイスが多すぎます。暗号化バックアップを保管し、Google のアプリデータを確認してください。
That Glacia cloud backup is no longer available.|Cadangan cloud Glacia tersebut tidak lagi tersedia.|その Glacia クラウドバックアップは利用できなくなりました。
Enter a cloud vault name of up to 80 characters.|Masukkan nama brankas cloud hingga 80 karakter.|クラウド保管庫の名前を80文字以内で入力してください。
Unlock Google sync with your sync password first.|Buka kunci sinkronisasi Google dengan kata sandi sinkronisasi terlebih dahulu.|先に同期パスワードで Google 同期のロックを解除してください。
Cloud vault metadata is invalid.|Metadata brankas cloud tidak valid.|クラウド保管庫のメタデータが無効です。
Your sync password cannot unlock the cloud vault. Use the same sync password on every computer.|Kata sandi sinkronisasi tidak dapat membuka brankas cloud. Gunakan kata sandi sinkronisasi yang sama di setiap PC.|同期パスワードでクラウド保管庫を開けません。すべての PC で同じ同期パスワードを使ってください。
Sync paused.|Sinkronisasi dijeda.|同期を一時停止しました。
Your cloud vault is too large. Save an encrypted local backup.|Brankas cloud terlalu besar. Simpan cadangan lokal terenkripsi.|クラウド保管庫が大きすぎます。暗号化したローカルバックアップを保存してください。
The sync passwords do not match.|Kata sandi sinkronisasi tidak cocok.|同期パスワードが一致しません。
Choose how to set up your vault.|Pilih cara menyiapkan brankas.|保管庫の設定方法を選んでください。
A vault already exists. Unlock it to connect Google.|Brankas sudah ada. Buka kuncinya untuk menghubungkan Google.|保管庫はすでに存在します。Google を接続するにはロックを解除してください。
Setup was canceled or locked. Try again.|Penyiapan dibatalkan atau dikunci. Coba lagi.|設定がキャンセル、またはロックされました。もう一度お試しください。
This Google transfer QR is damaged.|QR transfer Google ini rusak.|この Google 転送用 QR は破損しています。
The transfer QR contains an invalid setup key.|QR transfer berisi kunci penyiapan tidak valid.|転送用 QR に無効なセットアップキーが含まれています。
Choose a Google Authenticator export QR.|Pilih QR ekspor Google Authenticator.|Google Authenticator のエクスポート用 QR を選んでください。
The transfer QR has invalid version information.|Informasi versi QR transfer tidak valid.|転送用 QR のバージョン情報が無効です。
The transfer QR has invalid page information.|Informasi halaman QR transfer tidak valid.|転送用 QR のページ情報が無効です。
The transfer QR contains no accounts or too many accounts.|QR transfer tidak berisi akun atau berisi terlalu banyak akun.|転送用 QR にアカウントがないか、件数が多すぎます。
This transfer contains HOTP or an unsupported account type. No accounts were imported.|Transfer ini berisi HOTP atau jenis akun yang tidak didukung. Tidak ada akun yang diimpor.|この転送には HOTP または未対応のアカウント形式が含まれています。アカウントはインポートされませんでした。
This transfer contains unsupported code settings. No accounts were imported.|Transfer ini berisi pengaturan kode yang tidak didukung. Tidak ada akun yang diimpor.|この転送には未対応のコード設定が含まれています。アカウントはインポートされませんでした。
This QR belongs to another transfer. Close the review and start a new import.|QR ini milik transfer lain. Tutup tinjauan dan mulai impor baru.|この QR は別の転送のものです。確認画面を閉じ、新しいインポートを開始してください。
This QR conflicts with a page already scanned. Start the transfer again.|QR ini bertentangan dengan halaman yang sudah dipindai. Mulai transfer lagi.|この QR は読み取り済みのページと一致しません。転送を最初からやり直してください。
A transfer can contain up to 2000 accounts.|Transfer dapat memuat hingga 2000 akun.|転送できるアカウントは最大2000件です。
Unknown window action.|Tindakan jendela tidak dikenal.|不明なウィンドウ操作です。
The window is closed.|Jendela ditutup.|ウィンドウは閉じています。
Glacia is already unlocked.|Glacia sudah tidak terkunci.|Glacia はすでにロック解除されています。
The vault was locked. Try unlocking again.|Brankas dikunci. Coba buka kunci lagi.|保管庫がロックされました。ロック解除を再度お試しください。
This authenticator is already in your vault.|Autentikator ini sudah ada di brankas.|この認証キーはすでに保管庫にあります。
Invalid favorite setting.|Pengaturan favorit tidak valid.|お気に入りの設定が無効です。
Choose Personal or Work.|Pilih Pribadi atau Kerja.|個人用または仕事用を選んでください。
Open the delete confirmation again.|Buka konfirmasi penghapusan lagi.|削除の確認画面を開き直してください。
Wait five seconds before deleting this account.|Tunggu lima detik sebelum menghapus akun ini.|このアカウントを削除する前に5秒お待ちください。
Choose an encrypted backup first.|Pilih cadangan terenkripsi terlebih dahulu.|先に暗号化バックアップを選んでください。
Enter authenticator links.|Masukkan tautan autentikator.|認証リンクを入力してください。
The QR is invalid or too large.|QR tidak valid atau terlalu besar.|QR が無効、または大きすぎます。
Scan every QR page before importing this transfer.|Pindai semua halaman QR sebelum mengimpor transfer ini.|すべての QR ページを読み取ってからインポートしてください。
Choose accounts to import.|Pilih akun untuk diimpor.|インポートするアカウントを選んでください。
Select at least one account.|Pilih minimal satu akun.|アカウントを1つ以上選んでください。
Select accounts to export.|Pilih akun untuk diekspor.|書き出すアカウントを選んでください。
The vault was locked. Start the export again.|Brankas dikunci. Mulai ekspor lagi.|保管庫がロックされました。エクスポートをやり直してください。
Choose a file name ending in .txt.|Pilih nama file berakhiran .txt.|.txt で終わるファイル名を指定してください。
Choose a different export location.|Pilih lokasi ekspor lain.|別の保存先を選んでください。
Windows secure storage is unavailable. Enter your vault password.|Penyimpanan aman Windows tidak tersedia. Masukkan kata sandi brankas.|Windows の安全な保存機能を利用できません。保管庫のパスワードを入力してください。
Saved login could not be opened.|Login tersimpan tidak dapat dibuka.|保存したログイン情報を開けませんでした。
Windows secure storage is unavailable. Uncheck Keep me logged in to continue.|Penyimpanan aman Windows tidak tersedia. Nonaktifkan Tetap masuk untuk melanjutkan.|Windows の安全な保存機能を利用できません。「ログイン状態を保持」のチェックを外して続けてください。
Your saved login could not be restored. Enter your vault password.|Login tersimpan tidak dapat dipulihkan. Masukkan kata sandi brankas.|保存したログイン状態を復元できませんでした。保管庫のパスワードを入力してください。
Return to Glacia|Kembali ke Glacia|Glacia に戻る
Google sign-in was not completed.|Login Google belum selesai.|Google サインインが完了しませんでした。
Google responded. Glacia is finishing your connection.|Google merespons. Glacia sedang menyelesaikan koneksi Anda.|Google から応答がありました。Glacia が接続を完了しています。
Saved login could not be restored. Enter your vault password to continue.|Login tersimpan tidak dapat dipulihkan. Masukkan kata sandi brankas untuk melanjutkan.|保存したログイン状態を復元できませんでした。保管庫のパスワードを入力して続けてください。
Saved Google sign-in could not be opened. Please sign in again.|Login Google tersimpan tidak dapat dibuka. Silakan masuk lagi.|保存した Google サインイン情報を開けませんでした。サインインし直してください。
Pasted authenticator links|Tautan autentikator yang ditempel|貼り付けた認証リンク
Google Authenticator transfer|Transfer Google Authenticator|Google Authenticator からの転送
Setup QR image|Gambar QR penyiapan|セットアップ用 QR 画像
Saved sync could not be unlocked. Enter your sync password again.|Sinkronisasi tersimpan tidak dapat dibuka. Masukkan kembali kata sandi sinkronisasi.|保存した同期情報を開けませんでした。同期パスワードをもう一度入力してください。
Sync resumes automatically after you unlock this vault.|Sinkronisasi dilanjutkan otomatis setelah Anda membuka kunci brankas ini.|この保管庫のロックを解除すると、同期は自動的に再開します。
Unlock sync once to remember it securely on this PC.|Buka kunci sinkronisasi sekali untuk menyimpannya dengan aman di PC ini.|一度同期のロックを解除すると、この PC に安全に保存されます。
Your sync password will be remembered securely for this vault on this PC.|Kata sandi sinkronisasi akan disimpan dengan aman untuk brankas ini di PC ini.|同期パスワードを、この PC のこの保管庫用に安全に保存します。
Help & Recovery|Bantuan & Pemulihan|ヘルプと復元
A little guidance for your Glacia journey.|Panduan kecil untuk perjalanan Glacia Anda.|Glacia を使うための小さなガイド。
Your accounts, organized your way.|Akun Anda, diatur sesuai keinginan Anda.|自分に合った方法でアカウントを整理。
Manage folders|Kelola folder|フォルダーを管理
Create a folder|Buat folder|フォルダーを作成
Edit folder|Edit folder|フォルダーを編集
Delete folder|Hapus folder|フォルダーを削除
Delete folder?|Hapus folder?|フォルダーを削除しますか？
Folder name|Nama folder|フォルダー名
Folder color|Warna folder|フォルダーの色
For example, Gaming|Misalnya, Gaming|例：ゲーム
Folder preview|Pratinjau folder|フォルダーのプレビュー
Save folder|Simpan folder|フォルダーを保存
Built-in|Bawaan|標準
Folder saved.|Folder disimpan.|フォルダーを保存しました。
Folder removed. Your authenticators are safe.|Folder dihapus. Autentikator Anda tetap aman.|フォルダーを削除しました。認証アカウントはそのままです。
Accounts in this folder will move to Personal. No authenticators will be deleted.|Akun dalam folder ini akan dipindahkan ke Pribadi. Tidak ada autentikator yang dihapus.|このフォルダーのアカウントは「個人」に移動します。認証アカウントは削除されません。
Invalid folder.|Folder tidak valid.|無効なフォルダーです。
Too many folders.|Terlalu banyak folder.|フォルダーが多すぎます。
Enter a folder name of up to 60 characters.|Masukkan nama folder maksimal 60 karakter.|60文字以内でフォルダー名を入力してください。
Choose a folder color.|Pilih warna folder.|フォルダーの色を選んでください。
Folder not found.|Folder tidak ditemukan.|フォルダーが見つかりません。
A folder with this name already exists.|Folder dengan nama ini sudah ada.|同じ名前のフォルダーが既にあります。
Blue|Biru|青
Purple|Ungu|紫
Green|Hijau|緑
Amber|Kuning amber|琥珀色
Rose|Merah muda|ローズ
Slate|Abu-abu biru|青みの灰色
Connecting|Menghubungkan|接続中
Local vault|Brankas lokal|ローカル保管庫
Google sync is not connected.|Sinkronisasi Google belum terhubung.|Google 同期は接続されていません。
Paused|Dijeda|一時停止中
Unlock your vault to resume sync.|Buka kunci brankas untuk melanjutkan sinkronisasi.|保管庫のロックを解除すると同期が再開します。
Open Google sync to continue.|Buka sinkronisasi Google untuk melanjutkan.|続けるには Google 同期を開いてください。
Offline|Offline|オフライン
Codes still work. Sync will retry when you are online.|Kode tetap berfungsi. Sinkronisasi akan dicoba lagi saat Anda online.|コードは引き続き使えます。オンラインになると同期を再試行します。
Syncing|Menyinkronkan|同期中
Needs attention|Perlu diperiksa|確認が必要
Open Google sync to review the problem.|Buka sinkronisasi Google untuk memeriksa masalah.|Google 同期を開いて問題を確認してください。
Sync pending|Menunggu sinkronisasi|同期待ち
Waiting to sync your latest changes.|Menunggu sinkronisasi perubahan terbaru Anda.|最新の変更の同期を待っています。
Synced|Tersinkron|同期済み
Your latest changes are synced.|Perubahan terbaru Anda telah tersinkron.|最新の変更を同期しました。
Backup status|Status cadangan|バックアップの状態
Create a backup|Buat cadangan|バックアップを作成
Last encrypted backup|Cadangan terenkripsi terakhir|最後の暗号化バックアップ
Backup reminder|Pengingat cadangan|バックアップのリマインダー
Show a gentle reminder in Glacia when a backup is due.|Tampilkan pengingat lembut di Glacia saat waktunya membuat cadangan.|バックアップの時期に Glacia 内でリマインダーを表示します。
Every 7 days|Setiap 7 hari|7日ごと
Every 14 days|Setiap 14 hari|14日ごと
Every 30 days|Setiap 30 hari|30日ごと
No backup recorded on this PC.|Belum ada cadangan yang tercatat di PC ini.|この PC にはバックアップの記録がありません。
Changes since your last backup.|Ada perubahan sejak cadangan terakhir.|最後のバックアップ以降に変更があります。
No changes since this backup.|Tidak ada perubahan sejak cadangan ini.|このバックアップ以降の変更はありません。
Create an encrypted backup you can restore on another PC.|Buat cadangan terenkripsi yang dapat dipulihkan di PC lain.|別の PC で復元できる暗号化バックアップを作成してください。
A little backup goes a long way.|Cadangan kecil sangat berarti.|小さなバックアップで、大きな安心を。
Dismiss reminder|Tutup pengingat|リマインダーを閉じる
Backup reminder updated.|Pengingat cadangan diperbarui.|バックアップのリマインダーを更新しました。
Backup saved, but its status could not be recorded.|Cadangan disimpan, tetapi statusnya tidak dapat dicatat.|バックアップは保存されましたが、状態を記録できませんでした。
A little guidance, whenever you need it.|Panduan kecil, kapan pun Anda membutuhkannya.|必要なときに、ちょっとしたガイドを。
Add or import your authenticators|Tambah atau impor autentikator Anda|認証アカウントの追加とインポート
Use Add authenticator for a setup key, setup link, or QR image.|Gunakan Tambah autentikator untuk kunci penyiapan, tautan penyiapan, atau gambar QR.|設定キー、設定リンク、QR 画像を使う場合は「認証アカウントを追加」を選んでください。
For Google Authenticator, open Transfer accounts on your phone, then Export accounts. Import a clear image of every transfer QR page into Glacia and review the accounts before saving.|Untuk Google Authenticator, buka Transfer akun di ponsel, lalu Ekspor akun. Impor gambar yang jelas dari setiap halaman QR transfer ke Glacia dan tinjau akun sebelum menyimpan.|Google Authenticator では、スマートフォンで「アカウントを移行」から「アカウントをエクスポート」を開きます。すべての移行 QR ページの鮮明な画像を Glacia に取り込み、保存前にアカウントを確認してください。
Google sign-in syncs Glacia backups. It does not import your phone’s Google Authenticator cloud data.|Login Google menyinkronkan cadangan Glacia. Ini tidak mengimpor data cloud Google Authenticator di ponsel Anda.|Google サインインは Glacia のバックアップを同期します。スマートフォンの Google Authenticator のクラウドデータは取り込みません。
Back up and move to another PC|Buat cadangan dan pindah ke PC lain|バックアップと別の PC への移行
Export an encrypted Glacia backup on your old PC.|Ekspor cadangan Glacia terenkripsi di PC lama.|古い PC で暗号化した Glacia バックアップを書き出します。
Keep the backup file and its backup password somewhere you can access if this PC is lost.|Simpan file cadangan dan kata sandinya di tempat yang dapat diakses jika PC ini hilang.|この PC を紛失しても使える場所に、バックアップファイルとそのパスワードを保管してください。
On the new PC, create or unlock a local vault, then choose Import accounts and select your backup.|Di PC baru, buat atau buka kunci brankas lokal, lalu pilih Impor akun dan pilih cadangan Anda.|新しい PC でローカル保管庫を作成するかロックを解除し、「アカウントをインポート」からバックアップを選びます。
Enter the backup password, review the accounts, and import them.|Masukkan kata sandi cadangan, tinjau akun, lalu impor.|バックアップのパスワードを入力し、アカウントを確認してインポートします。
Import merges accounts and skips duplicates. An encrypted backup preserves your custom folders.|Impor menggabungkan akun dan melewati duplikat. Cadangan terenkripsi mempertahankan folder khusus Anda.|インポートはアカウントを統合し、重複をスキップします。暗号化バックアップにはカスタムフォルダーも保存されます。
Open Import / Export|Buka Impor / Ekspor|インポート／エクスポートを開く
Restore a Google cloud backup|Pulihkan cadangan cloud Google|Google クラウドバックアップを復元
On a new PC, sign in with the same Google account and choose Restore a Glacia cloud backup. Select your cloud vault and enter its sync password.|Di PC baru, masuk dengan akun Google yang sama dan pilih Pulihkan cadangan cloud Glacia. Pilih brankas cloud dan masukkan kata sandi sinkronisasinya.|新しい PC で同じ Google アカウントにサインインし、「Glacia クラウドバックアップを復元」を選びます。クラウド保管庫を選択し、同期パスワードを入力してください。
You can choose a different local vault password on the new PC. With an existing local vault, unlock it, connect the same Google account, and unlock sync to merge your accounts.|Anda dapat memilih kata sandi brankas lokal yang berbeda di PC baru. Jika brankas lokal sudah ada, buka kuncinya, hubungkan akun Google yang sama, lalu buka kunci sinkronisasi untuk menggabungkan akun.|新しい PC では別のローカル保管庫パスワードを選べます。既存のローカル保管庫がある場合は、ロックを解除して同じ Google アカウントに接続し、同期のロックを解除するとアカウントが統合されます。
Keep an independent encrypted backup, even when Google sync is on.|Tetap simpan cadangan terenkripsi terpisah meskipun sinkronisasi Google aktif.|Google 同期を使っていても、独立した暗号化バックアップを保管してください。
Open Google sync|Buka sinkronisasi Google|Google 同期を開く
Understand your passwords|Pahami kata sandi Anda|パスワードについて
Unlocks the local vault on this PC. Use at least 6 characters.|Membuka kunci brankas lokal di PC ini. Gunakan minimal 6 karakter.|この PC のローカル保管庫を開きます。6文字以上を使用してください。
Protects your Google cloud backups. Use the same sync password on each PC, with at least 12 characters.|Melindungi cadangan cloud Google Anda. Gunakan kata sandi sinkronisasi yang sama di setiap PC, minimal 12 karakter.|Google クラウドバックアップを保護します。すべての PC で同じ12文字以上の同期パスワードを使用してください。
Protects an exported backup file. Use at least 12 characters and keep it for restoring that file.|Melindungi file cadangan yang diekspor. Gunakan minimal 12 karakter dan simpan untuk memulihkan file tersebut.|書き出したバックアップファイルを保護します。12文字以上を使用し、そのファイルを復元するために保管してください。
These passwords can be different. Glacia cannot recover forgotten passwords, and Google sign-in cannot decrypt a backup by itself.|Kata sandi ini boleh berbeda. Glacia tidak dapat memulihkan kata sandi yang terlupa, dan login Google saja tidak dapat mendekripsi cadangan.|これらのパスワードは別々に設定できます。Glacia は忘れたパスワードを復元できず、Google サインインだけではバックアップを復号できません。
Lock, sign out, and disconnect|Kunci, keluar, dan putuskan koneksi|ロック、サインアウト、接続解除
The top lock button locks your vault while keeping Google signed in. Unlock the vault to continue.|Tombol kunci di atas mengunci brankas sambil tetap masuk ke Google. Buka kunci brankas untuk melanjutkan.|上部のロックボタンは Google のサインインを維持したまま保管庫をロックします。続けるには保管庫のロックを解除してください。
Sign Out locks the vault and removes the saved Google sign-in and saved vault login. Signing in again with the same Google account resumes its saved sync after you unlock the vault.|Keluar mengunci brankas dan menghapus login Google serta login brankas yang tersimpan. Masuk lagi dengan akun Google yang sama akan melanjutkan sinkronisasi tersimpan setelah brankas dibuka.|サインアウトは保管庫をロックし、保存した Google サインインと保管庫のログインを削除します。同じ Google アカウントに再度サインインして保管庫を開くと、保存された同期を再開します。
Disconnect Google stops syncing on this PC. Your local accounts and existing encrypted cloud copies remain available.|Putuskan Google menghentikan sinkronisasi di PC ini. Akun lokal dan salinan cloud terenkripsi yang sudah ada tetap tersedia.|Google の接続解除はこの PC の同期を停止します。ローカルアカウントと既存の暗号化クラウドコピーは引き続き使えます。
Offline codes and sign-in problems|Kode offline dan masalah masuk|オフラインのコードとサインインの問題
Your codes work offline. Google sync retries while Glacia is open, unlocked, and online.|Kode Anda berfungsi offline. Sinkronisasi Google dicoba lagi saat Glacia terbuka, tidak terkunci, dan online.|コードはオフラインでも使えます。Glacia を開いてロックを解除し、オンラインにすると Google 同期を再試行します。
If a code is rejected, check that Windows date, time, and time zone are correct. Wait for a fresh code and try again.|Jika kode ditolak, pastikan tanggal, waktu, dan zona waktu Windows benar. Tunggu kode baru lalu coba lagi.|コードが拒否された場合は、Windows の日付、時刻、タイムゾーンが正しいか確認してください。新しいコードを待って再試行します。
Service logos help you recognize an account. Accounts without a supported logo show their initials.|Logo layanan membantu mengenali akun. Akun tanpa logo yang didukung akan menampilkan inisial.|サービスのロゴはアカウントを見分けるためのものです。対応するロゴがない場合は頭文字を表示します。
Glacia Authenticator is app from Winter Garden Project for your two-step Verification Codes.|Glacia Authenticator adalah aplikasi dari Winter Garden Project untuk kode verifikasi dua langkah Anda.|Glacia Authenticator は Winter Garden Project による、2段階認証コードのためのアプリです。
It keeps your keys in an encrypted local vault, works offline, and supports optional encrypted Google sync across your computers.|Aplikasi ini menyimpan kunci Anda dalam brankas lokal terenkripsi, berfungsi offline, dan mendukung sinkronisasi Google terenkripsi opsional antar komputer.|キーを暗号化されたローカル保管庫に保存し、オフラインでも動作します。複数の PC 間で暗号化した Google 同期を任意で利用できます。
Finish the pending password change first.|Selesaikan perubahan kata sandi terlebih dahulu.|先に保留中のパスワード変更を完了してください。
Finish the pending password change before unlocking.|Selesaikan perubahan kata sandi sebelum membuka brankas.|保管庫を開く前に保留中のパスワード変更を完了してください。
Create your one Glacia password first.|Buat satu kata sandi Glacia terlebih dahulu.|先に Glacia の共通パスワードを作成してください。
Sign in to the original Google account before changing this password.|Masuk ke akun Google semula sebelum mengubah kata sandi ini.|パスワードを変更する前に元の Google アカウントにログインしてください。
The old password is incorrect.|Kata sandi lama salah.|現在のパスワードが正しくありません。
The new passwords do not match.|Kata sandi baru tidak cocok.|新しいパスワードが一致しません。
Close Glacia?|Tutup Glacia?|Glacia を閉じますか？
Keep Glacia in the system tray or exit the app?|Simpan Glacia di baki sistem atau keluar dari aplikasi?|Glacia をトレイに格納しますか、それとも終了しますか？
Minimize to tray|Minimalkan ke baki sistem|トレイに格納
Exit app|Keluar dari aplikasi|アプリを終了
Don't ask me again|Jangan tanyakan lagi|次回から確認しない
Close button behavior|Perilaku tombol tutup|閉じるボタンの動作
Choose what happens when you click X.|Pilih tindakan saat Anda mengeklik X.|X をクリックしたときの動作を選びます。
Ask every time|Tanyakan setiap kali|毎回確認
Glacia password|Kata sandi Glacia|Glacia のパスワード
Create Glacia password|Buat kata sandi Glacia|Glacia のパスワードを作成
Confirm Glacia password|Konfirmasi kata sandi Glacia|Glacia のパスワードを確認
One password for Glacia.|Satu kata sandi untuk Glacia.|Glacia のパスワードを1つに。
Change Glacia password|Ubah kata sandi Glacia|Glacia のパスワードを変更
Change password|Ubah kata sandi|パスワードを変更
Old password|Kata sandi lama|現在のパスワード
New password|Kata sandi baru|新しいパスワード
Confirm new password|Konfirmasi kata sandi baru|新しいパスワードを確認
Previous sync password|Kata sandi sinkronisasi sebelumnya|以前の同期パスワード
Save new password|Simpan kata sandi baru|新しいパスワードを保存
Your Glacia password has been changed.|Kata sandi Glacia telah diubah.|Glacia のパスワードを変更しました。
Unlock Google sync|Buka sinkronisasi Google|Google 同期を解除
Finish password change|Selesaikan perubahan kata sandi|パスワード変更を完了
Start quietly in the system tray when you sign in to Windows.|Mulai diam-diam di baki sistem saat masuk ke Windows.|Windows へのサインイン時にトレイで起動します。
Restoring a backup from an older Glacia version?|Memulihkan cadangan dari versi Glacia lama?|旧バージョンの Glacia のバックアップを復元しますか？
Your previous sync password is needed only for this upgrade. Your keys will be kept.|Kata sandi sinkronisasi sebelumnya hanya diperlukan saat peningkatan ini. Kunci Anda tetap tersimpan.|以前の同期パスワードはこの移行時だけ必要です。キーは保持されます。
Use one password for your local vault and Google sync. Your keys and settings will be kept.|Gunakan satu kata sandi untuk brankas lokal dan sinkronisasi Google. Kunci dan pengaturan tetap tersimpan.|ローカル保管庫と Google 同期に同じパスワードを使います。キーと設定は保持されます。
One password for your vault and Google sync.|Satu kata sandi untuk brankas dan sinkronisasi Google.|保管庫と Google 同期に1つのパスワードを使います。
Enter your Glacia password to connect this vault.|Masukkan kata sandi Glacia untuk menghubungkan brankas ini.|Glacia のパスワードを入力してこの保管庫を接続します。
One Glacia password protects your local vault and unlocks Google sync.|Satu kata sandi Glacia melindungi brankas lokal dan membuka sinkronisasi Google.|1つの Glacia パスワードでローカル保管庫と Google 同期を利用できます。
Keep your Glacia password somewhere safe. Google sign-in cannot recover it.|Simpan kata sandi Glacia di tempat aman. Login Google tidak dapat memulihkannya.|Glacia のパスワードを安全な場所に保管してください。Google ログインでは復元できません。
Locking clears sensitive keys from memory.|Mengunci brankas menghapus kunci sensitif dari memori.|ロックすると機密キーがメモリから消去されます。
Google sign-in alone cannot decrypt your vault. Your Glacia password is needed to restore it.|Login Google saja tidak dapat membuka brankas. Kata sandi Glacia diperlukan untuk memulihkannya.|Google ログインだけでは保管庫を復号できません。復元には Glacia のパスワードが必要です。
Enter your Glacia password once on this PC. Sync resumes after you reopen your vault.|Masukkan kata sandi Glacia sekali di PC ini. Sinkronisasi dilanjutkan setelah brankas dibuka kembali.|この PC で Glacia のパスワードを一度入力します。保管庫を再度開くと同期が再開します。
Unlocks your local vault and Google sync. Use at least 6 characters.|Membuka brankas lokal dan sinkronisasi Google. Gunakan minimal 6 karakter.|ローカル保管庫と Google 同期を解除します。6文字以上を使用してください。
Use the same Glacia password on your computers. For an older cloud backup, enter its previous sync password once during the upgrade.|Gunakan kata sandi Glacia yang sama di setiap komputer. Untuk cadangan cloud lama, masukkan kata sandi sinkronisasi sebelumnya sekali saat peningkatan.|各 PC で同じ Glacia パスワードを使います。旧クラウドバックアップは移行時に以前の同期パスワードを一度入力します。
An exported backup keeps its own password, including backups made before a password change. Glacia cannot recover forgotten passwords.|Cadangan yang diekspor tetap menggunakan kata sandinya sendiri, termasuk cadangan sebelum perubahan kata sandi. Glacia tidak dapat memulihkan kata sandi yang terlupa.|エクスポートしたバックアップは変更前のものも含め保存時のパスワードを使います。Glacia は忘れたパスワードを復元できません。
On a new PC, sign in with the same Google account and choose Restore a Glacia cloud backup. Select your cloud vault and enter your Glacia password.|Di PC baru, masuk dengan akun Google yang sama dan pilih Pulihkan cadangan cloud Glacia. Pilih brankas cloud dan masukkan kata sandi Glacia.|新しい PC で同じ Google アカウントにログインし、Glacia クラウドバックアップの復元を選びます。保管庫を選択して Glacia のパスワードを入力します。
Reconnect to Google to finish your password change. Your encrypted vault is preserved.|Hubungkan kembali ke Google untuk menyelesaikan perubahan kata sandi. Brankas terenkripsi tetap tersimpan.|Google に再接続してパスワード変更を完了してください。暗号化された保管庫は保持されています。
Password recovery data could not be read. Your encrypted vault is preserved.|Data pemulihan kata sandi tidak dapat dibaca. Brankas terenkripsi tetap tersimpan.|パスワードの復旧情報を読み取れませんでした。暗号化された保管庫は保持されています。
Your accounts are encrypted before uploading to Glacia’s private Google Drive app data. Use your Glacia password on every computer.|Akun dienkripsi sebelum diunggah ke data aplikasi privat Glacia di Google Drive. Gunakan kata sandi Glacia di setiap komputer.|アカウントは Google Drive の Glacia 専用データへ送信する前に暗号化されます。各 PC で Glacia のパスワードを使います。
Sync runs while Glacia is open, unlocked, and online. Locking clears sensitive keys from memory.|Sinkronisasi berjalan saat Glacia terbuka, brankas tidak terkunci, dan terhubung ke internet. Mengunci brankas menghapus kunci sensitif dari memori.|Glacia が開き、ロック解除され、オンラインの間に同期します。ロックすると機密キーがメモリから消去されます。
Windows secure storage is unavailable.|Penyimpanan aman Windows tidak tersedia.|Windows の安全な保存領域が利用できません。
The cloud password record is invalid.|Data kata sandi cloud tidak valid.|クラウドのパスワード情報が無効です。
Incorrect Glacia password for this cloud vault.|Kata sandi Glacia untuk brankas cloud ini salah.|このクラウド保管庫の Glacia パスワードが正しくありません。
Conflicting cloud password records. Contact Glacia support.|Data kata sandi cloud bertentangan. Hubungi dukungan Glacia.|クラウドのパスワード情報が競合しています。Glacia サポートにお問い合わせください。
Invalid cloud password record.|Data kata sandi cloud tidak valid.|クラウドのパスワード情報が無効です。
Could not read the cloud password record.|Data kata sandi cloud tidak dapat dibaca.|クラウドのパスワード情報を読み取れませんでした。
This cloud vault needs the one-password upgrade.|Brankas cloud ini perlu ditingkatkan ke satu kata sandi.|このクラウド保管庫は共通パスワードへの移行が必要です。
Cloud password changed on another computer. Unlock it again.|Kata sandi cloud diubah di komputer lain. Buka kembali brankasnya.|別の PC でクラウドのパスワードが変更されました。再度解除してください。
Sign in to the original Google account to finish this password change.|Masuk ke akun Google semula untuk menyelesaikan perubahan kata sandi ini.|元の Google アカウントにログインしてパスワード変更を完了してください。
Invalid cloud encryption key.|Kunci enkripsi cloud tidak valid.|クラウドの暗号化キーが無効です。
Invalid password transaction.|Proses perubahan kata sandi tidak valid.|パスワード変更の記録が無効です。
The previous sync passwords do not match.|Kata sandi sinkronisasi sebelumnya tidak cocok.|以前の同期パスワードが一致しません。
`;
for(const row of messages.trim().split('\n')){const [source,id,ja]=row.split('|');if(!source||!id||!ja)throw Error('Invalid translation row: '+source);if(catalog[source])throw Error('Duplicate translation: '+source);catalog[source]={id,ja};}
const templates=Object.keys(catalog).filter(key=>key.includes('{')).map(source=>{const names=[];const pattern=source.split(/(\{\w+\})/).map(part=>{if(/^\{\w+\}$/.test(part)){const name=part.slice(1,-1);names.push(name);return ['count','seconds','period','digits','scanned','total','skipped','line','status'].includes(name)?'(\\d+)':'([\\s\\S]+?)';}return part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('');return {source,names,pattern:new RegExp('^'+pattern+'$')};});
function translate(text,language){const lang=normalizeLanguage(language);if(lang==='en'||typeof text!=='string')return text;const source=text.trim();let translated=catalog[source]?.[lang];if(!translated)for(const template of templates){const match=template.pattern.exec(source);if(match){translated=catalog[template.source][lang].replace(/\{(\w+)\}/g,(_all,name)=>{const value=match[template.names.indexOf(name)+1];return name==='message'?translate(value,lang):value;});break;}}return translated?text.slice(0,text.indexOf(source))+translated+text.slice(text.indexOf(source)+source.length):text;}
return {languages,normalizeLanguage,translate,catalog};
});
