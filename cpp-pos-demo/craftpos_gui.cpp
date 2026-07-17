#define UNICODE
#define _UNICODE
#include <windows.h>
#include <stdlib.h>
#include <string>
#include <tchar.h>
#include <wrl.h>
#include "WebView2.h"
#include <filesystem>
#include <algorithm>
#include <shlobj.h>
#include <shobjidl.h>

using namespace Microsoft::WRL;
namespace fs = std::filesystem;

// Pointer to function from DLL
typedef HRESULT (STDAPICALLTYPE *CreateCoreWebView2EnvironmentWithOptionsFn)(
    PCWSTR browserExecutableFolder,
    PCWSTR userDataFolder,
    ICoreWebView2EnvironmentOptions* environmentOptions,
    ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* environmentCreatedHandler
);

CreateCoreWebView2EnvironmentWithOptionsFn CreateCoreWebView2EnvironmentWithOptionsPtr = nullptr;

// Global variables
HWND hWndParent;
ICoreWebView2Controller* webviewController = nullptr;
ICoreWebView2* webviewWindow = nullptr;
bool g_isInstallerMode = false;
std::wstring g_installDir;

// Function to check and set up installer mode
void CheckInstallerMode() {
    wchar_t exePath[MAX_PATH];
    GetModuleFileNameW(NULL, exePath, MAX_PATH);
    std::wstring currentExePathStr(exePath);

    wchar_t localAppPath[MAX_PATH];
    if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_LOCAL_APPDATA, NULL, 0, localAppPath))) {
        std::wstring installDir = std::wstring(localAppPath) + L"\\CraftPOS";
        g_installDir = installDir;
        std::wstring installedExePath = installDir + L"\\CraftPOS.exe";

        // Case insensitive comparison
        std::wstring currentUpper = currentExePathStr;
        std::wstring installedUpper = installedExePath;
        for (auto& c : currentUpper) c = towupper(c);
        for (auto& c : installedUpper) c = towupper(c);

        if (currentUpper == installedUpper) {
            g_isInstallerMode = false;
        } else {
            g_isInstallerMode = true;
        }
    } else {
        g_isInstallerMode = true;
    }
}

// Helper to create shell link
HRESULT CreateLink(LPCWSTR lpszPathObj, LPCWSTR lpszPathLink, LPCWSTR lpszDesc, LPCWSTR lpszIconPath) {
    HRESULT hres;
    IShellLinkW* psl;
    hres = CoCreateInstance(CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, IID_IShellLinkW, (LPVOID*)&psl);
    if (SUCCEEDED(hres)) {
        IPersistFile* ppf;
        psl->SetPath(lpszPathObj);
        psl->SetDescription(lpszDesc);
        if (lpszIconPath && lpszIconPath[0] != L'\0') {
            psl->SetIconLocation(lpszIconPath, 0);
        }
        hres = psl->QueryInterface(IID_IPersistFile, (LPVOID*)&ppf);
        if (SUCCEEDED(hres)) {
            hres = ppf->Save(lpszPathLink, TRUE);
            ppf->Release();
        }
        psl->Release();
    }
    return hres;
}

// Perform file copies and desktop shortcut creation
bool PerformInstallation() {
    try {
        wchar_t exePath[MAX_PATH];
        GetModuleFileNameW(NULL, exePath, MAX_PATH);
        fs::path currentExe(exePath);
        fs::path currentDir = currentExe.parent_path();
        fs::path destDir(g_installDir);

        // 1. Create installation directory
        if (!fs::exists(destDir)) {
            fs::create_directories(destDir);
        }

        // 2. Copy CraftPOS.exe
        fs::path destExe = destDir / "CraftPOS.exe";
        fs::copy_file(currentExe, destExe, fs::copy_options::overwrite_existing);

        // 3. Copy WebView2Loader.dll
        fs::path srcDll = currentDir / "WebView2Loader.dll";
        fs::path destDll = destDir / "WebView2Loader.dll";
        if (fs::exists(srcDll)) {
            fs::copy_file(srcDll, destDll, fs::copy_options::overwrite_existing);
        }

        // 4. Copy craftpos_icon.ico
        fs::path srcIcon = currentDir / "craftpos_icon.ico";
        fs::path destIcon = destDir / "craftpos_icon.ico";
        if (fs::exists(srcIcon)) {
            fs::copy_file(srcIcon, destIcon, fs::copy_options::overwrite_existing);
        }

        // 5. Copy out/ directory recursively
        fs::path srcOut = currentDir / "out";
        if (!fs::exists(srcOut)) {
            srcOut = currentDir.parent_path() / "out";
        }
        fs::path destOut = destDir / "out";
        if (fs::exists(srcOut)) {
            if (fs::exists(destOut)) {
                fs::remove_all(destOut);
            }
            fs::copy(srcOut, destOut, fs::copy_options::recursive | fs::copy_options::overwrite_existing);
        }

        // 6. Copy console fallback if exists
        fs::path srcConsole = currentDir / "craftpos.exe";
        fs::path destConsole = destDir / "craftpos_terminal.exe";
        if (fs::exists(srcConsole)) {
            fs::copy_file(srcConsole, destConsole, fs::copy_options::overwrite_existing);
        }

        // 7. Create desktop shortcut
        wchar_t desktopPath[MAX_PATH];
        if (SUCCEEDED(SHGetFolderPathW(NULL, CSIDL_DESKTOPDIRECTORY, NULL, 0, desktopPath))) {
            std::wstring shortcutPath = std::wstring(desktopPath) + L"\\CraftPOS.lnk";
            std::wstring targetPath = destExe.wstring();
            std::wstring workingDir = destDir.wstring();
            std::wstring iconPath = destIcon.wstring();

            CreateLink(targetPath.c_str(), shortcutPath.c_str(), L"CraftPOS GUI Desktop", iconPath.c_str());
        }

        return true;
    } catch (const std::exception& e) {
        OutputDebugStringA(e.what());
        return false;
    } catch (...) {
        return false;
    }
}

// Custom COM Handler for Web Messages
class WebMessageReceivedEventHandler : public ICoreWebView2WebMessageReceivedEventHandler {
public:
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppvObject) override {
        if (!ppvObject) return E_POINTER;
        if (riid == IID_IUnknown || riid == IID_ICoreWebView2WebMessageReceivedEventHandler) {
            *ppvObject = this;
            return S_OK;
        }
        *ppvObject = nullptr;
        return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
    ULONG STDMETHODCALLTYPE Release() override { return 1; }

    HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2* sender, ICoreWebView2WebMessageReceivedEventArgs* args) override {
        LPWSTR message = nullptr;
        args->TryGetWebMessageAsString(&message);
        if (message != nullptr) {
            std::wstring msgStr(message);
            CoTaskMemFree(message);

            if (msgStr == L"install") {
                bool ok = PerformInstallation();
                if (ok) {
                    sender->PostWebMessageAsString(L"install_success");
                } else {
                    sender->PostWebMessageAsString(L"install_failed");
                }
            } else if (msgStr.find(L"JS_") == 0) {
                // Log JavaScript messages to a file for debugging
                wchar_t exePath[MAX_PATH];
                GetModuleFileNameW(NULL, exePath, MAX_PATH);
                fs::path exePathFs(exePath);
                fs::path logPath = exePathFs.parent_path() / "craftpos_debug.log";
                
                FILE* f = _wfopen(logPath.wstring().c_str(), L"a, ccs=UTF-8");
                if (f) {
                    fwprintf(f, L"%s\n", msgStr.c_str());
                    fclose(f);
                }
            }
        }
        return S_OK;
    }
};

// Callback for WebView2 creation
class EnvironmentCompletedHandler : public ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler {
public:
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppvObject) override {
        if (!ppvObject) return E_POINTER;
        if (riid == IID_IUnknown || riid == IID_ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler) {
            *ppvObject = this;
            return S_OK;
        }
        *ppvObject = nullptr;
        return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
    ULONG STDMETHODCALLTYPE Release() override { return 1; }

    HRESULT STDMETHODCALLTYPE Invoke(HRESULT result, ICoreWebView2Environment* env) override {
        if (FAILED(result)) return result;

        class ControllerCompletedHandler : public ICoreWebView2CreateCoreWebView2ControllerCompletedHandler {
        private:
            ICoreWebView2Environment* _env;
        public:
            ControllerCompletedHandler(ICoreWebView2Environment* env) : _env(env) {}
            HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppvObject) override {
                if (!ppvObject) return E_POINTER;
                if (riid == IID_IUnknown || riid == IID_ICoreWebView2CreateCoreWebView2ControllerCompletedHandler) {
                    *ppvObject = this;
                    return S_OK;
                }
                *ppvObject = nullptr;
                return E_NOINTERFACE;
            }
            ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
            ULONG STDMETHODCALLTYPE Release() override { return 1; }

            HRESULT STDMETHODCALLTYPE Invoke(HRESULT result, ICoreWebView2Controller* controller) override {
                if (FAILED(result)) return result;

                webviewController = controller;
                webviewController->get_CoreWebView2(&webviewWindow);

                // Resolve path to the 'out' static folder (next to exe or one level up)
                wchar_t exePath[MAX_PATH];
                GetModuleFileNameW(NULL, exePath, MAX_PATH);
                fs::path exePathFs(exePath);
                fs::path installDirFs = exePathFs.parent_path();
                fs::path outDirFs = installDirFs / L"out";
                if (!fs::exists(outDirFs)) {
                    outDirFs = installDirFs.parent_path() / L"out";
                }

                // Log the path for debugging
                {
                    fs::path logPath = installDirFs / L"craftpos_debug.log";
                    FILE* f = _wfopen(logPath.wstring().c_str(), L"w, ccs=UTF-8");
                    if (f) {
                        fwprintf(f, L"ExePath: %s\n", exePathFs.wstring().c_str());
                        fwprintf(f, L"OutDir: %s\n", outDirFs.wstring().c_str());
                        fwprintf(f, L"OutExists: %s\n", fs::exists(outDirFs) ? L"YES" : L"NO");
                        fclose(f);
                    }
                }

                // Set WebMessageReceived event handler
                EventRegistrationToken webMessageToken;
                webviewWindow->add_WebMessageReceived(new WebMessageReceivedEventHandler(), &webMessageToken);

                ICoreWebView2Settings* settings = nullptr;
                webviewWindow->get_Settings(&settings);
                if (settings) {
                    settings->put_AreDefaultContextMenusEnabled(TRUE);
                    settings->put_AreDevToolsEnabled(TRUE);
                    settings->Release();
                }

                // Add NavigationCompleted event handler for error logging
                class NavigationCompletedEventHandler : public ICoreWebView2NavigationCompletedEventHandler {
                public:
                    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppvObject) override {
                        if (!ppvObject) return E_POINTER;
                        if (riid == IID_IUnknown || riid == IID_ICoreWebView2NavigationCompletedEventHandler) {
                            *ppvObject = this;
                            return S_OK;
                        }
                        *ppvObject = nullptr;
                        return E_NOINTERFACE;
                    }
                    ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
                    ULONG STDMETHODCALLTYPE Release() override { return 1; }

                    HRESULT STDMETHODCALLTYPE Invoke(ICoreWebView2* sender, ICoreWebView2NavigationCompletedEventArgs* args) override {
                        BOOL isSuccess;
                        args->get_IsSuccess(&isSuccess);
                        if (!isSuccess) {
                            COREWEBVIEW2_WEB_ERROR_STATUS status;
                            args->get_WebErrorStatus(&status);
                            wchar_t buf[256];
                            swprintf_s(buf, 256, L"Error de navegacion. Codigo: %d", (int)status);
                            MessageBoxW(NULL, buf, L"Error WebView2", MB_ICONERROR);
                        }
                        return S_OK;
                    }
                };
                EventRegistrationToken navToken;
                webviewWindow->add_NavigationCompleted(new NavigationCompletedEventHandler(), &navToken);

                // Resize webview to match window size
                RECT bounds;
                GetClientRect(hWndParent, &bounds);
                webviewController->put_Bounds(bounds);

                // Build file:// URL directly to index.html
                // With assetPrefix: './' all _next chunks use relative paths -> works offline
                std::wstring outDir = outDirFs.wstring();
                // Replace backslashes with forward slashes for file:// URL
                std::replace(outDir.begin(), outDir.end(), L'\\', L'/');
                std::wstring baseUrl = L"file:///" + outDir + L"/index.html";

                if (g_isInstallerMode) {
                    webviewWindow->Navigate((baseUrl + L"?mode=install").c_str());
                } else {
                    webviewWindow->Navigate(baseUrl.c_str());
                }

                return S_OK;
            }
        };

        env->CreateCoreWebView2Controller(hWndParent, new ControllerCompletedHandler(env));
        return S_OK;
    }
};

LRESULT CALLBACK WndProc(HWND hWnd, UINT message, WPARAM wParam, LPARAM lParam) {
    switch (message) {
        case WM_SIZE:
            if (webviewController != nullptr) {
                RECT bounds;
                GetClientRect(hWnd, &bounds);
                webviewController->put_Bounds(bounds);
            }
            break;
        case WM_DESTROY:
            PostQuitMessage(0);
            break;
        default:
            return DefWindowProc(hWnd, message, wParam, lParam);
    }
    return 0;
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow) {
    // 1. Initialize COM
    CoInitializeEx(NULL, COINIT_APARTMENTTHREADED);

    // 2. Check if we are running in installer mode or standard mode
    CheckInstallerMode();

    // Load WebView2Loader.dll
    HMODULE hLib = LoadLibraryA("WebView2Loader.dll");
    if (!hLib) {
        MessageBoxA(NULL, "No se pudo encontrar 'WebView2Loader.dll'. Asegurate de extraer el ZIP completo.", "Error de Ejecucion", MB_ICONERROR);
        return 1;
    }

    CreateCoreWebView2EnvironmentWithOptionsPtr = (CreateCoreWebView2EnvironmentWithOptionsFn)
        GetProcAddress(hLib, "CreateCoreWebView2EnvironmentWithOptions");

    if (!CreateCoreWebView2EnvironmentWithOptionsPtr) {
        MessageBoxA(NULL, "La DLL WebView2Loader no es compatible.", "Error", MB_ICONERROR);
        return 1;
    }

    // Register class
    const wchar_t szWindowClass[] = L"CraftPOSGUI";
    std::wstring titleStr = g_isInstallerMode ? L"Asistente de Instalacion de CraftPOS" : L"CraftPOS Desktop (C++ & Edge)";
    const wchar_t* szTitle = titleStr.c_str();

    WNDCLASSEXW wcex = { 0 };
    wcex.cbSize = sizeof(WNDCLASSEXW);
    wcex.style = CS_HREDRAW | CS_VREDRAW;
    wcex.lpfnWndProc = WndProc;
    wcex.hInstance = hInstance;
    wcex.hCursor = LoadCursor(NULL, IDC_ARROW);
    wcex.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wcex.lpszClassName = szWindowClass;

    if (!RegisterClassExW(&wcex)) {
        return 1;
    }

    // Create Window
    hWndParent = CreateWindowW(
        szWindowClass, szTitle, WS_OVERLAPPEDWINDOW,
        CW_USEDEFAULT, CW_USEDEFAULT, 1200, 800,
        NULL, NULL, hInstance, NULL
    );

    if (!hWndParent) {
        return 1;
    }

    ShowWindow(hWndParent, SW_SHOWNORMAL);
    UpdateWindow(hWndParent);

    // Initialize WebView2
    HRESULT hr = CreateCoreWebView2EnvironmentWithOptionsPtr(nullptr, nullptr, nullptr, new EnvironmentCompletedHandler());
    if (FAILED(hr)) {
        MessageBoxA(hWndParent, "Error al inicializar el entorno WebView2. Verifica que tengas Microsoft Edge WebView2 Runtime instalado.", "Error de Inicializacion", MB_ICONERROR);
    }

    // Message Loop
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    CoUninitialize();
    return (int)msg.wParam;
}
