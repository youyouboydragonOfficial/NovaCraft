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
            var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
            await webView.EnsureCoreWebView2Async(env);

            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string wwwrootDir = Path.Combine(appDir, "wwwroot");

            if (!Directory.Exists(wwwrootDir))
            {
                // Fallback for development if run directly from build output
                string altDir = Path.GetFullPath(Path.Combine(appDir, "..", "..", "..", "wwwroot"));
                if (Directory.Exists(altDir))
                {
                    wwwrootDir = altDir;
                }
            }

            webView.CoreWebView2.SetVirtualHostNameToFolderMapping(
                "novacraft.game",
                wwwrootDir,
                CoreWebView2HostResourceAccessKind.Allow
            );

            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.AreDevToolsEnabled = true; // Useful for F12 debug
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;

            webView.Source = new Uri("https://novacraft.game/index.html");
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
}
