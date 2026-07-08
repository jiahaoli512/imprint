import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var scrollObservation: NSKeyValueObservation?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        registerCustomPlugins()
        enableWebInspector()
        return true
    }

    // Local (non-npm) Capacitor plugins aren't auto-discovered the way
    // cap-sync-installed ones are — Capacitor's iOS bridge only auto-wires
    // plugins that `cap sync` explicitly linked in. A plugin like
    // KeychainStoragePlugin, added directly to this target, has to be handed
    // to the bridge manually or JS-side registerPlugin() calls resolve to
    // "plugin is not implemented on ios". Do that once at launch, via the same
    // CAPBridgeViewController reference enableWebInspector() below also uses.
    private var pluginsRegistered = false
    private func registerCustomPlugins() {
        guard !pluginsRegistered,
              let bridgeVC = window?.rootViewController as? CAPBridgeViewController else { return }
        _ = bridgeVC.view // force the view (and bridge) to load if it hasn't already
        bridgeVC.bridge?.registerPluginInstance(KeychainStoragePlugin())
        pluginsRegistered = true
    }

    // Since iOS 16.4, WKWebView.isInspectable defaults to false for every build
    // (debug included) — Safari's Web Inspector shows the device but "No
    // inspectable contents" until this is explicitly opted in. Set it as early
    // as possible (launch, not 0.5s after the app is already active and the
    // WebView has already loaded) via CAPBridgeViewController's own typed
    // `.webView` property — the storyboard's root view controller is Capacitor's
    // CAPBridgeViewController, so this is a direct, reliable reference, unlike
    // the recursive subview search setupScrollObserver below uses for its own
    // (unrelated) purpose. Debug-only so a release build never exposes this.
    // Accessing `.view` forces the view (and so the WebView) to load if it
    // hasn't already, so this doesn't depend on view-loading timing either.
    private func enableWebInspector() {
        #if DEBUG
        if #available(iOS 16.4, *),
           let bridgeVC = window?.rootViewController as? CAPBridgeViewController {
            _ = bridgeVC.view
            bridgeVC.webView?.isInspectable = true
        }
        #endif
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        enableWebInspector()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.setupScrollObserver()
        }
    }

    private func setupScrollObserver() {
        guard let rootView = self.window?.rootViewController?.view,
              let webView = findWKWebView(in: rootView) else { return }

        let appBg = UIColor(red: 8/255, green: 12/255, blue: 20/255, alpha: 1)
        webView.backgroundColor = appBg
        webView.scrollView.backgroundColor = appBg
        self.window?.backgroundColor = appBg

        webView.scrollView.bounces = true
        webView.scrollView.alwaysBounceVertical = true
        webView.scrollView.alwaysBounceHorizontal = false
        webView.scrollView.showsHorizontalScrollIndicator = false

        scrollObservation = webView.scrollView.observe(\.contentOffset, options: [.new]) { scrollView, _ in
            if scrollView.contentOffset.x != 0 {
                scrollView.contentOffset = CGPoint(x: 0, y: scrollView.contentOffset.y)
            }
        }
    }

    private func findWKWebView(in view: UIView) -> WKWebView? {
        if let webView = view as? WKWebView { return webView }
        for subview in view.subviews {
            if let found = findWKWebView(in: subview) { return found }
        }
        return nil
    }

    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {
        enableWebInspector()
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.setupScrollObserver()
        }
    }
    func applicationWillTerminate(_ application: UIApplication) {}

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return true
    }
}
