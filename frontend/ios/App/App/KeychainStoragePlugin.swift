import Foundation
import Capacitor
import Security

// Minimal native bridge to the iOS Keychain, backing the app's session-token
// storage (see frontend/src/api/client.js). Written as a small local plugin
// rather than a third-party npm dependency: at the time this was added, every
// free Capacitor Keychain plugin (aparajita, evva, the original martinkasa
// package) was CocoaPods-only with no Package.swift, and this app's iOS
// project is pure Swift Package Manager — pulling one in would have meant
// standing up a second native dependency manager for a surface this small
// (get/set/remove one string). This plugin is discovered automatically by
// Capacitor's iOS bridge (any @objc class conforming to CAPBridgedPlugin that's
// compiled into the app target is found via Objective-C runtime introspection
// at launch) — no separate registration step is needed.
@objc(KeychainStoragePlugin)
public class KeychainStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "KeychainStoragePlugin"
    public let jsName = "KeychainStorage"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setItem", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "removeItem", returnType: CAPPluginReturnPromise),
    ]

    // Scoping the Keychain item to this app's own bundle id keeps it isolated
    // from anything else that might read the same device's Keychain.
    private let service = Bundle.main.bundleIdentifier ?? "com.imprint.app"

    private func query(for key: String) -> [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
    }

    @objc func getItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing 'key'")
            return
        }
        var q = query(for: key)
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne

        var result: AnyObject?
        let status = SecItemCopyMatching(q as CFDictionary, &result)
        if status == errSecSuccess, let data = result as? Data, let value = String(data: data, encoding: .utf8) {
            call.resolve(["value": value])
        } else if status == errSecItemNotFound {
            call.resolve(["value": NSNull()])
        } else {
            call.reject("Keychain read failed (OSStatus \(status))")
        }
    }

    @objc func setItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key"), let value = call.getString("value") else {
            call.reject("Missing 'key' or 'value'")
            return
        }
        // Delete-then-add is simpler and more reliable across OS versions than
        // trying SecItemUpdate first and falling back to SecItemAdd.
        SecItemDelete(query(for: key) as CFDictionary)

        var attributes = query(for: key)
        attributes[kSecValueData as String] = Data(value.utf8)
        // Available as soon as the device has been unlocked once since boot,
        // and never synced to iCloud/other devices — appropriate for a session
        // token that shouldn't outlive this device.
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        let status = SecItemAdd(attributes as CFDictionary, nil)
        if status == errSecSuccess {
            call.resolve()
        } else {
            call.reject("Keychain write failed (OSStatus \(status))")
        }
    }

    @objc func removeItem(_ call: CAPPluginCall) {
        guard let key = call.getString("key") else {
            call.reject("Missing 'key'")
            return
        }
        let status = SecItemDelete(query(for: key) as CFDictionary)
        if status == errSecSuccess || status == errSecItemNotFound {
            call.resolve()
        } else {
            call.reject("Keychain delete failed (OSStatus \(status))")
        }
    }
}
