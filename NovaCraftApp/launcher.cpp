#include <windows.h>
#include <shellapi.h>
#include <string>

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Try launching the .NET Windows Desktop app NovaCraft.exe if present
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    std::string dir(exePath);
    size_t lastSlash = dir.find_last_of("\\/");
    if (lastSlash != std::string::npos) {
        dir = dir.substr(0, lastSlash);
    }

    std::string appExe = dir + "\\NovaCraft.exe";
    DWORD attr = GetFileAttributesA(appExe.c_str());
    if (attr != INVALID_FILE_ATTRIBUTES && !(attr & FILE_ATTRIBUTE_DIRECTORY)) {
        HINSTANCE res = ShellExecuteA(NULL, "open", appExe.c_str(), NULL, dir.c_str(), SW_SHOW);
        if ((INT_PTR)res > 32) {
            return 0; // successfully launched
        }
    }

    // 2. Fallback: Launch default browser directly to index.html
    std::string htmlPath = dir + "\\wwwroot\\index.html";
    ShellExecuteA(NULL, "open", htmlPath.c_str(), NULL, dir.c_str(), SW_SHOW);
    return 0;
}
