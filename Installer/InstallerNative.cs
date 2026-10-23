using System;
using System.IO;
using System.Net;
using System.Diagnostics;
using System.Windows.Forms;
using System.Drawing;
using System.Threading;

namespace NovaCraftInstaller
{
    public class InstallerForm : Form
    {
        private ProgressBar progressBar;
        private Label statusLabel;
        private Button startButton;
        private string appName = "NovaCraft";
        private string installDir;
        private string releaseZipUrl = "https://github.com/youyouboydragonOfficial/NovaCraft/releases/download/v2.2.0/NovaCraft-Windows-v2.2.0.zip";
        private bool isSilent = false;

        [STAThread]
        public static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            // Trap all unhandled exceptions to prevent raw crash dialogs
            Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
            Application.ThreadException += (s, e) => HandleFatalError(e.Exception);
            AppDomain.CurrentDomain.UnhandledException += (s, e) => HandleFatalError(e.ExceptionObject as Exception);

            bool silent = args != null && Array.Exists(args, a => a.Equals("/silent", StringComparison.OrdinalIgnoreCase) || a.Equals("/s", StringComparison.OrdinalIgnoreCase) || a.Equals("-s", StringComparison.OrdinalIgnoreCase));
            Application.Run(new InstallerForm(silent));
        }

        private static void HandleFatalError(Exception? ex)
        {
            string msg = ex != null ? ex.Message : "不明なエラーが発生しました。";
            MessageBox.Show(
                "セットアップ中に以下の問題が発生しました:\n" + msg + "\n\n" +
                "【一番簡単な解決方法】\n" +
                "GitHub から 'NovaCraft-Setup.exe' を再ダウンロードして起動してください。",
                "NovaCraft セットアップ案内",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }

        public InstallerForm(bool silent = false)
        {
            this.isSilent = silent;
            this.Text = "NovaCraft セットアップ (Ultimate Voxel Sandbox)";
            this.Size = new Size(540, 280);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(242, 242, 246);

            installDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                appName
            );

            Label titleLabel = new Label
            {
                Text = "NovaCraft インストーラー",
                Font = new Font("Segoe UI", 15, FontStyle.Bold),
                Location = new Point(25, 20),
                AutoSize = true,
                ForeColor = Color.FromArgb(30, 30, 50)
            };
            this.Controls.Add(titleLabel);

            Label descLabel = new Label
            {
                Text = "ホーム画面 (デスクトップ) に NovaCraft をセットアップします。\n境界制限なしの無限世界、リアルなサバイバル＆クリエイティブを楽しめます。",
                Font = new Font("Segoe UI", 9.5f),
                Location = new Point(25, 55),
                Size = new Size(480, 40),
                ForeColor = Color.FromArgb(70, 70, 80)
            };
            this.Controls.Add(descLabel);

            statusLabel = new Label
            {
                Text = "準備完了。「インストール開始」をクリックしてください。",
                Font = new Font("Segoe UI", 9),
                Location = new Point(25, 110),
                Size = new Size(480, 22),
                ForeColor = Color.FromArgb(80, 80, 90)
            };
            this.Controls.Add(statusLabel);

            progressBar = new ProgressBar
            {
                Location = new Point(25, 135),
                Size = new Size(475, 24),
                Minimum = 0,
                Maximum = 100,
                Value = 0
            };
            this.Controls.Add(progressBar);

            startButton = new Button
            {
                Text = "インストール開始",
                Font = new Font("Segoe UI", 10.5f, FontStyle.Bold),
                Location = new Point(340, 180),
                Size = new Size(160, 40),
                BackColor = Color.FromArgb(46, 125, 50),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            startButton.FlatAppearance.BorderSize = 0;
            startButton.Click += StartButton_Click;
            this.Controls.Add(startButton);

            if (this.isSilent)
            {
                this.Shown += (s, e) =>
                {
                    startButton.Enabled = false;
                    Thread installThread = new Thread(DoInstall);
                    installThread.IsBackground = true;
                    installThread.Start();
                };
            }
        }

        private void StartButton_Click(object sender, EventArgs e)
        {
            startButton.Enabled = false;
            Thread installThread = new Thread(DoInstall);
            installThread.IsBackground = true;
            installThread.Start();
        }

        private void SetStatus(string text, int percent = -1)
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(() => SetStatus(text, percent)));
                return;
            }
            statusLabel.Text = text;
            if (percent >= 0)
            {
                progressBar.Value = Math.Min(100, Math.Max(0, percent));
            }
        }

        private void DoInstall()
        {
            try
            {
                SetStatus("インストール先フォルダを準備中...", 10);
                if (!Directory.Exists(installDir))
                {
                    Directory.CreateDirectory(installDir);
                }

                // 0. Check for Embedded ZIP Payload (Highest priority: 100% self-contained offline installer!)
                bool installedFromPayload = false;
                var assembly = typeof(InstallerForm).Assembly;
                string[] resNames = assembly.GetManifestResourceNames();
                string payloadRes = null;
                foreach (string name in resNames)
                {
                    if (name.EndsWith("payload.zip", StringComparison.OrdinalIgnoreCase) || name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase))
                    {
                        payloadRes = name;
                        break;
                    }
                }

                if (!string.IsNullOrEmpty(payloadRes))
                {
                    SetStatus("内蔵ゲームパッケージを展開中 (通信不要・高速セットアップ)...", 25);
                    string tempZip = Path.Combine(Path.GetTempPath(), "NovaCraft-Setup-Payload-" + Guid.NewGuid().ToString("N") + ".zip");
                    using (Stream stream = assembly.GetManifestResourceStream(payloadRes))
                    using (FileStream fs = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                    {
                        byte[] buffer = new byte[81920];
                        long totalBytes = stream.Length;
                        long readBytes = 0;
                        int read;
                        while ((read = stream.Read(buffer, 0, buffer.Length)) > 0)
                        {
                            fs.Write(buffer, 0, read);
                            readBytes += read;
                            int pct = 25 + (int)((readBytes / (double)totalBytes) * 35);
                            SetStatus($"内蔵ゲームパッケージを準備中... {pct}%", pct);
                        }
                    }

                    SetStatus("ゲームファイルを配置中...", 65);
                    ExtractZipZeroDependency(tempZip, installDir);
                    try { File.Delete(tempZip); } catch { }
                    installedFromPayload = true;
                    SetStatus("展開完了", 85);
                }

                if (!installedFromPayload)
                {
                    // 1. Check if game files are locally available in directory
                    string currentDir = AppDomain.CurrentDomain.BaseDirectory;
                    string localPublish = Path.Combine(currentDir, "publish_selfcontained");
                    if (!Directory.Exists(localPublish) || !File.Exists(Path.Combine(localPublish, "NovaCraft.exe")))
                    {
                        localPublish = Path.Combine(currentDir, "publish_fx");
                    }
                    if (!Directory.Exists(localPublish) || !File.Exists(Path.Combine(localPublish, "NovaCraft.exe")))
                    {
                        localPublish = currentDir;
                    }

                    bool hasLocalGame = File.Exists(Path.Combine(localPublish, "NovaCraft.exe")) && Directory.Exists(Path.Combine(localPublish, "wwwroot"));

                    // 2. Check if package ZIP is locally available next to installer
                    string localZip = Path.Combine(currentDir, "NovaCraft-Windows-v2.2.0.zip");
                    if (!File.Exists(localZip))
                    {
                        localZip = Path.Combine(currentDir, "NovaCraft-Windows-v1.0.0.zip");
                    }
                    if (!File.Exists(localZip))
                    {
                        string[] zips = Directory.GetFiles(currentDir, "*.zip");
                        if (zips.Length > 0) localZip = zips[0];
                    }

                    if (hasLocalGame && localPublish != installDir)
                    {
                        SetStatus("ローカルゲームファイルをコピー中...", 30);
                        CopyDirectory(localPublish, installDir);
                        SetStatus("コピー完了", 80);
                    }
                    else if (File.Exists(localZip))
                    {
                        SetStatus("ローカルパッケージ ZIP から高速展開中 (通信不要)...", 30);
                        ExtractZipZeroDependency(localZip, installDir);
                        SetStatus("展開完了", 80);
                    }
                    else if (!File.Exists(Path.Combine(installDir, "NovaCraft.exe")))
                    {
                        // Need to download package from GitHub with User-Agent & Retry logic
                        SetStatus("最新のゲームパッケージをダウンロード中...", 20);
                        string tempZip = Path.Combine(Path.GetTempPath(), "NovaCraft-Setup-Temp.zip");

                        bool downloaded = false;
                        string lastError = "";

                        for (int attempt = 1; attempt <= 3; attempt++)
                        {
                            try
                            {
                                if (File.Exists(tempZip)) File.Delete(tempZip);
                                using (WebClient client = new WebClient())
                                {
                                    ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | (SecurityProtocolType)12288 | SecurityProtocolType.Tls;
                                    client.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                                    client.DownloadProgressChanged += (s, ev) =>
                                    {
                                        SetStatus(string.Format("ダウンロード中: {0}% ({1:0.0} MB / {2:0.0} MB)",
                                            ev.ProgressPercentage,
                                            ev.BytesReceived / (1024.0 * 1024.0),
                                            ev.TotalBytesToReceive / (1024.0 * 1024.0)),
                                            20 + (int)(ev.ProgressPercentage * 0.5));
                                    };
                                    client.DownloadFile(new Uri(releaseZipUrl), tempZip);
                                }

                                if (File.Exists(tempZip) && new FileInfo(tempZip).Length > 10000000)
                                {
                                    downloaded = true;
                                    break;
                                }
                            }
                            catch (Exception ex)
                            {
                                lastError = ex.Message;
                                SetStatus(string.Format("ダウンロード再試行中 ({0}/3)...", attempt), 20);
                                Thread.Sleep(1500);
                            }
                        }

                        if (!downloaded)
                        {
                            throw new Exception("ゲームファイルのダウンロードに失敗しました: " + lastError + "\n\nブラウザから 'NovaCraft-Windows-v2.2.0.zip' を直接ダウンロードして解凍することをお勧めします。");
                        }

                        SetStatus("ゲームファイルを展開中...", 75);
                        ExtractZipZeroDependency(tempZip, installDir);
                        try { File.Delete(tempZip); } catch { }
                    }
                }

                // Create Desktop Shortcuts
                SetStatus("ホーム画面 (デスクトップ) にアイコンを作成中...", 90);
                string targetExe = Path.Combine(installDir, "NovaCraft.exe");
                if (!File.Exists(targetExe))
                {
                    // Search in subdirectories
                    string[] matches = Directory.GetFiles(installDir, "NovaCraft.exe", SearchOption.AllDirectories);
                    if (matches.Length > 0)
                    {
                        targetExe = matches[0];
                    }
                }

                string workingDir = Path.GetDirectoryName(targetExe);

                // 1. Desktop
                string desktop = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                CreateShortcut(targetExe, Path.Combine(desktop, appName + ".lnk"), workingDir, "NovaCraft - Ultimate Infinite Voxel Sandbox");

                // 2. OneDrive Desktop if available
                string userProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
                string oneDriveDesktop = Path.Combine(userProfile, "OneDrive", "Desktop");
                if (Directory.Exists(oneDriveDesktop))
                {
                    CreateShortcut(targetExe, Path.Combine(oneDriveDesktop, appName + ".lnk"), workingDir, "NovaCraft");
                }

                // 3. Start Menu
                string startMenu = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.StartMenu), "Programs", appName);
                if (!Directory.Exists(startMenu)) Directory.CreateDirectory(startMenu);
                CreateShortcut(targetExe, Path.Combine(startMenu, appName + ".lnk"), workingDir, "NovaCraft");

                SetStatus("インストールが正常に完了しました！", 100);

                this.BeginInvoke(new Action(() =>
                {
                    if (this.isSilent)
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = targetExe,
                            WorkingDirectory = workingDir,
                            UseShellExecute = true
                        });
                        this.Close();
                        return;
                    }

                    DialogResult res = MessageBox.Show(
                        "NovaCraft のインストールが正常に完了しました！\n\n" +
                        "★ ホーム画面 (デスクトップ) にアイコンを追加しました。\n\n" +
                        "今すぐゲームを起動しますか？",
                        "インストール完了",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Information
                    );

                    if (res == DialogResult.Yes)
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = targetExe,
                            WorkingDirectory = workingDir,
                            UseShellExecute = true
                        });
                    }
                    this.Close();
                }));
            }
            catch (Exception ex)
            {
                SetStatus("案内: " + ex.Message, 0);
                this.BeginInvoke(new Action(() =>
                {
                    DialogResult askOpen = MessageBox.Show(
                        ex.Message + "\n\nブラウザで直接ダウンロードページを開きますか？\n（ZIPを解凍するだけでインストール不要で遊べます）",
                        "NovaCraft セットアップ",
                        MessageBoxButtons.YesNo,
                        MessageBoxIcon.Information
                    );

                    if (askOpen == DialogResult.Yes)
                    {
                        try
                        {
                            Process.Start(new ProcessStartInfo
                            {
                                FileName = "https://github.com/youyouboydragonOfficial/NovaCraft/releases/latest",
                                UseShellExecute = true
                            });
                        }
                        catch { }
                    }
                    startButton.Enabled = true;
                }));
            }
        }

        // Fast & Safe ZIP Extraction (Native .NET ZipFile -> Windows Shell COM -> PowerShell fallback)
        private void ExtractZipZeroDependency(string zipPath, string extractPath)
        {
            if (!Directory.Exists(extractPath))
            {
                Directory.CreateDirectory(extractPath);
            }

            try
            {
                System.IO.Compression.ZipFile.ExtractToDirectory(zipPath, extractPath, true);
                return;
            }
            catch { }

            try
            {
                Type shellAppType = Type.GetTypeFromProgID("Shell.Application");
                if (shellAppType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellAppType);
                    dynamic zipFolder = shell.NameSpace(Path.GetFullPath(zipPath));
                    dynamic destFolder = shell.NameSpace(Path.GetFullPath(extractPath));

                    if (zipFolder != null && destFolder != null)
                    {
                        // 4 = Do not display a progress dialog box, 16 = Respond with "Yes to All" for any dialog box
                        destFolder.CopyHere(zipFolder.Items(), 4 | 16 | 512 | 1024);
                        return;
                    }
                }
            }
            catch { }

            // Fallback: PowerShell Expand-Archive (built into every Windows 10 & 11)
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = string.Format("-NoProfile -ExecutionPolicy Bypass -Command \"Expand-Archive -LiteralPath '{0}' -DestinationPath '{1}' -Force\"", zipPath, extractPath),
                    WindowStyle = ProcessWindowStyle.Hidden,
                    CreateNoWindow = true,
                    UseShellExecute = false
                };
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit();
                }
            }
            catch (Exception ex)
            {
                throw new Exception("ZIPファイルの展開に失敗しました: " + ex.Message);
            }
        }

        private void CopyDirectory(string sourceDir, string targetDir)
        {
            foreach (string file in Directory.GetFiles(sourceDir))
            {
                string name = Path.GetFileName(file);
                if (name.Equals("NovaCraft-Setup.exe", StringComparison.OrdinalIgnoreCase)) continue;
                string dest = Path.Combine(targetDir, name);
                File.Copy(file, dest, true);
            }

            foreach (string subDir in Directory.GetDirectories(sourceDir))
            {
                string name = Path.GetFileName(subDir);
                string destSub = Path.Combine(targetDir, name);
                if (!Directory.Exists(destSub)) Directory.CreateDirectory(destSub);
                CopyDirectory(subDir, destSub);
            }
        }

        private void CreateShortcut(string targetPath, string shortcutPath, string workingDir, string description)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                if (shellType != null)
                {
                    dynamic shell = Activator.CreateInstance(shellType);
                    dynamic shortcut = shell.CreateShortcut(shortcutPath);
                    shortcut.TargetPath = targetPath;
                    shortcut.WorkingDirectory = workingDir;
                    shortcut.Description = description;
                    shortcut.Save();
                }
            }
            catch { }
        }
    }
}
