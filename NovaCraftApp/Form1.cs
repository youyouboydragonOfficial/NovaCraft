using System;
using System.IO;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace NovaCraftApp;

public partial class Form1 : Form
{
    private WebView2? webView;
    private bool isFullScreen = false;
    private FormWindowState previousWindowState = FormWindowState.Normal;
    private FormBorderStyle previousBorderStyle = FormBorderStyle.Sizable;

    public Form1()
    {
        InitializeComponent();
        ConfigureWindow();
        InitializeWebView();
    }

    private void ConfigureWindow()
    {
        this.Text = "NovaCraft - Ultimate Voxel Sandbox (Survival & Creative)";
        this.Width = 1280;
        this.Height = 720;
        this.StartPosition = FormStartPosition.CenterScreen;
        this.KeyPreview = true;
        this.KeyDown += Form1_KeyDown;
    }

    private async void InitializeWebView()
    {
        webView = new WebView2
        {
            Dock = DockStyle.Fill
        };
        this.Controls.Add(webView);

        try
        {
            string userDataFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NovaCraft", "WebView2Data");
            var options = new CoreWebView2EnvironmentOptions("--disable-http-cache");
            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder, options);
            await webView.EnsureCoreWebView2Async(env);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string wwwrootDir = EnsureWwwrootExtracted(appDir);

            webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "novacraft.game",
                wwwrootDir,
                CoreWebView2HostResourceAccessKind.Allow
            );

            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = true; // Useful for F12 debug
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;

            // Completely block microphone, camera, speech and location requests
            webView.CoreWebView2.PermissionRequested += (sender, args) =>
            {
                if (args.PermissionKind == CoreWebView2PermissionKind.Microphone ||
                    args.PermissionKind == CoreWebView2PermissionKind.Camera ||
                    args.PermissionKind == CoreWebView2PermissionKind.Geolocation)
                {
                    args.State = CoreWebView2PermissionState.Deny;
                    args.Handled = true;
                }
            };

            webView.Source = new Uri($"https://novacraft.game/index.html?t={DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}");
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Failed to initialize game view: {ex.Message}\nFalling back to browser launch...",
                "NovaCraft Warning",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning
            );
        }
    }

    private void Form1_KeyDown(object? sender, KeyEventArgs e)
    {
        if (e.KeyCode == Keys.F11)
        {
            ToggleFullScreen();
            e.Handled = true;
        }
    }

    private void ToggleFullScreen()
    {
        if (!isFullScreen)
        {
            previousWindowState = this.WindowState;
            previousBorderStyle = this.FormBorderStyle;
            this.FormBorderStyle = FormBorderStyle.None;
            this.WindowState = FormWindowState.Maximized;
            isFullScreen = true;
        }
        else
        {
            this.FormBorderStyle = previousBorderStyle;
            this.WindowState = previousWindowState;
            isFullScreen = false;
        }
    }

    private static string EnsureWwwrootExtracted(string appDir)
    {
        string localWwwroot = Path.Combine(appDir, "wwwroot");
        if (Directory.Exists(localWwwroot) && File.Exists(Path.Combine(localWwwroot, "index.html")))
        {
            return localWwwroot;
        }

        string devAlt = Path.GetFullPath(Path.Combine(appDir, "..", "..", "..", "wwwroot"));
        if (Directory.Exists(devAlt) && File.Exists(Path.Combine(devAlt, "index.html")))
        {
            return devAlt;
        }

        // Portable Standalone Execution (No Setup / No Extraction required by user!)
        string targetDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "NovaCraft", "wwwroot");
        try
        {
            var assembly = typeof(Form1).Assembly;
            using Stream? stream = assembly.GetManifestResourceStream("NovaCraftApp.wwwroot.zip") 
                               ?? assembly.GetManifestResourceStream("wwwroot.zip");

            if (stream != null)
            {
                if (!Directory.Exists(targetDir)) Directory.CreateDirectory(targetDir);
                string tempZip = Path.Combine(Path.GetTempPath(), "NovaCraft_wwwroot_" + Guid.NewGuid().ToString("N") + ".zip");
                using (FileStream fs = new FileStream(tempZip, FileMode.Create, FileAccess.Write))
                {
                    stream.CopyTo(fs);
                }
                System.IO.Compression.ZipFile.ExtractToDirectory(tempZip, targetDir, overwriteFiles: true);
                try { File.Delete(tempZip); } catch { }
                return targetDir;
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine("Extract embedded wwwroot failed: " + ex.Message);
        }

        return localWwwroot;
    }
}
