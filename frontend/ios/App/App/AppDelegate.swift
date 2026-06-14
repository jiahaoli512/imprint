import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var scrollObservation: NSKeyValueObservation?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        return true
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
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
