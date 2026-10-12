using System;
using System.IO;
using System.IO.Compression;
using System.Diagnostics;
using System.Windows.Forms;
using System.Runtime.InteropServices;

namespace NovaCraftInstaller;

class Program
{
    [STAThread]
    static void Main(string[] args)
    {
        Application.EnableVisualStyles();
        Application.SetCompatibleTextRenderingDefault(false);

        string appName = "NovaCraft";
        string installDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "Programs",
            appName
        );

        DialogResult prompt = MessageBox.Show(
            "NovaCraft (Infinite Voxel Sandbox) をこのPCにインストールしますか？\n\n" +
            "・インストール先: " + installDir + "\n" +
            "・ホーム画面 (デスクトップ) にショートカットアイコンが追加されます。",
            "NovaCraft セットアップ",
            MessageBoxButtons.YesNo,
            MessageBoxIcon.Question
        );

        if (prompt != DialogResult.Yes)
        {
            return;
        }

        try
        {
            // 1. Create install directory
            if (!Directory.Exists(installDir))
            {
                Directory.CreateDirectory(installDir);
            }

            // 2. Source directory where files currently reside
            string sourceDir = AppDomain.CurrentDomain.BaseDirectory;
            string publishDir = Path.Combine(sourceDir, "publish_fx");
            if (!Directory.Exists(publishDir))
            {
                publishDir = sourceDir;
            }

            CopyDirectory(publishDir, installDir);

            // 3. Create Desktop Shortcut (Home Screen)
            string desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            string desktopShortcut = Path.Combine(desktopDir, $"{appName}.lnk");
            string targetExe = Path.Combine(installDir, "NovaCraft.exe");
            if (!File.Exists(targetExe))
            {
                targetExe = Path.Combine(installDir, "NovaCraftLauncher.exe");
            }

            CreateShortcut(targetExe, desktopShortcut, installDir, "NovaCraft - Ultimate Infinite Voxel Sandbox");

            // 4. Create Start Menu Shortcut
            string startMenuDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.StartMenu),
                "Programs",
                appName
            );
            if (!Directory.Exists(startMenuDir))
            {
                Directory.CreateDirectory(startMenuDir);
            }
            string startMenuShortcut = Path.Combine(startMenuDir, $"{appName}.lnk");
            CreateShortcut(targetExe, startMenuShortcut, installDir, "NovaCraft");

            // 5. Success Message & Launch Option
            DialogResult launch = MessageBox.Show(
                "NovaCraft のインストールが正常に完了しました！\n\n" +
                "★ ホーム画面 (デスクトップ) にアイコンを追加しました。\n\n" +
                "今すぐゲームを起動しますか？",
                "インストール完了",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Information
            );

            if (launch == DialogResult.Yes)
            {
                Process.Start(new ProcessStartInfo
                {
                    FileName = targetExe,
                    WorkingDirectory = installDir,
                    UseShellExecute = true
                });
            }
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                "インストール中にエラーが発生しました:\n" + ex.Message,
                "インストールエラー",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
        }
    }

    static void CopyDirectory(string sourceDir, string targetDir)
    {
        foreach (string file in Directory.GetFiles(sourceDir))
        {
            string fileName = Path.GetFileName(file);
            if (fileName.Equals("NovaCraft-Setup.exe", StringComparison.OrdinalIgnoreCase)) continue;
            string dest = Path.Combine(targetDir, fileName);
            File.Copy(file, dest, true);
        }

        foreach (string subDir in Directory.GetDirectories(sourceDir))
        {
            string dirName = Path.GetFileName(subDir);
            string destSub = Path.Combine(targetDir, dirName);
            if (!Directory.Exists(destSub))
            {
                Directory.CreateDirectory(destSub);
            }
            CopyDirectory(subDir, destSub);
        }
    }

    static void CreateShortcut(string targetPath, string shortcutPath, string workingDir, string description)
    {
        try
        {
            // Use Windows Shell COM object to create authentic .lnk shortcut
            Type? shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType != null)
            {
                dynamic shell = Activator.CreateInstance(shellType)!;
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = workingDir;
                shortcut.Description = description;
                shortcut.Save();
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Shortcut creation error: " + ex.Message);
        }
    }
}
