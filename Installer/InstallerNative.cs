using System;
using System.IO;
using System.IO.Compression;
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
        private string releaseZipUrl = "https://github.com/youyouboydragonOfficial/NovaCraft/releases/download/v1.0.0/NovaCraft-Windows-v1.0.0.zip";

        [STAThread]
        public static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }

        public InstallerForm()
        {
            this.Text = "NovaCraft セットアップ (Ultimate Voxel Sandbox)";
            this.Size = new Size(520, 260);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(240, 240, 245);

            installDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                appName
            );

            Label titleLabel = new Label
            {
                Text = "NovaCraft インストーラー",
                Font = new Font("Segoe UI", 14, FontStyle.Bold),
                Location = new Point(25, 20),
                AutoSize = true,
                ForeColor = Color.FromArgb(30, 30, 50)
            };
            this.Controls.Add(titleLabel);

            Label descLabel = new Label
            {
                Text = "ホーム画面 (デスクトップ) に NovaCraft を追加・セットアップします。\n境界制限なしの無限世界、リアルなサバイバル＆クリエイティブを楽しめます。",
                Font = new Font("Segoe UI", 9.5f),
                Location = new Point(25, 55),
                Size = new Size(460, 40),
                ForeColor = Color.FromArgb(70, 70, 80)
            };
            this.Controls.Add(descLabel);

            statusLabel = new Label
            {
                Text = "準備完了。「インストール」をクリックしてください。",
                Font = new Font("Segoe UI", 9),
                Location = new Point(25, 110),
                Size = new Size(460, 22),
                ForeColor = Color.FromArgb(80, 80, 90)
            };
            this.Controls.Add(statusLabel);

            progressBar = new ProgressBar
            {
                Location = new Point(25, 135),
                Size = new Size(455, 22),
                Minimum = 0,
                Maximum = 100,
                Value = 0
            };
            this.Controls.Add(progressBar);

            startButton = new Button
            {
                Text = "インストール開始",
                Font = new Font("Segoe UI", 10, FontStyle.Bold),
                Location = new Point(340, 172),
                Size = new Size(140, 35),
                BackColor = Color.FromArgb(46, 125, 50),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat
            };
            startButton.FlatAppearance.BorderSize = 0;
            startButton.Click += StartButton_Click;
            this.Controls.Add(startButton);
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

                // Check if game files are locally available near installer
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

                if (hasLocalGame && localPublish != installDir)
                {
                    SetStatus("ローカルゲームファイルをコピー中...", 30);
                    CopyDirectory(localPublish, installDir);
                    SetStatus("コピー完了", 80);
                }
                else if (!File.Exists(Path.Combine(installDir, "NovaCraft.exe")))
                {
                    // Need to download package from GitHub
                    SetStatus("最新のゲームパッケージをダウンロード中 (数秒お待ちください)...", 20);
                    string tempZip = Path.Combine(Path.GetTempPath(), "NovaCraft-Setup-Temp.zip");

                    using (WebClient client = new WebClient())
                    {
                        ServicePointManager.SecurityProtocol = (SecurityProtocolType)3072 | SecurityProtocolType.Tls;
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

                    SetStatus("ゲームファイルを展開中...", 75);
                    ZipFile.ExtractToDirectory(tempZip, installDir);
                    try { File.Delete(tempZip); } catch { }
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
                SetStatus("エラー: " + ex.Message, 0);
                this.BeginInvoke(new Action(() =>
                {
                    MessageBox.Show(
                        "インストール中にエラーが発生しました:\n" + ex.Message + "\n\n" +
                        "同梱されている 'Install-To-Desktop.bat' または 'Play-NovaCraft.bat' を直接実行して起動することも可能です。",
                        "エラー",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    startButton.Enabled = true;
                }));
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
