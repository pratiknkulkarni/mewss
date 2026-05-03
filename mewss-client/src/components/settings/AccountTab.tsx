import {useState} from "react";
import {AlertTriangle, Key, MonitorSmartphone, Trash2, X, Check, Smartphone, Laptop} from "lucide-react";
import {TabShell} from "@/components/settings/TabShell.tsx";

const MOCK_SESSIONS = [
    {
        id: "sess_1",
        token: "mock_token_1",
        ipAddress: "192.168.1.5",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0",
        createdAt: new Date().toISOString(),
        isCurrent: true, // Compute this later by matching session.id with your current active session id
    },
    {
        id: "sess_2",
        token: "mock_token_2",
        ipAddress: "172.16.0.42",
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X)",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        isCurrent: false,
    }
];

const parseUA = (ua) => {
    if (!ua) return {name: "Unknown Device", icon: MonitorSmartphone};
    if (ua.includes("iPhone") || ua.includes("Android") || ua.includes("Mobile")) return {
        name: "Mobile Device",
        icon: Smartphone
    };
    if (ua.includes("Macintosh")) return {name: "Mac OS", icon: Laptop};
    if (ua.includes("Windows")) return {name: "Windows PC", icon: Laptop};
    return {name: "Unknown Device", icon: MonitorSmartphone};
};


export function AccountTab() {
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [passwords, setPasswords] = useState({old: "", new: "", confirm: ""});
    const [toast, setToast] = useState(null);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");

    const showToast = (message, type = "default") => {
        setToast({message, type});
        setTimeout(() => setToast(null), 3000);
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            return showToast("New passwords do not match.", "destructive");
        }
        if (passwords.new.length < 8) {
            return showToast("Password is too weak.", "destructive");
        }
        showToast("Password updated successfully.", "success");
        setIsResettingPassword(false);
        setPasswords({old: "", new: "", confirm: ""});
    };

    const handleLogoutDevices = () => {
        showToast("Logged out of all other devices.", "success");
    };

    const handleDeleteAccount = (e) => {
        e.preventDefault();
        showToast("Account deleted. You are being redirected.", "destructive");
        setIsDeleting(false);
    };

    return (
        <TabShell
            title="Account"
            description="Manage your password, terminate active sessions, or permanently delete your account."
        >
            <div className="w-full max-w-3xl space-y-12 relative">
                {toast && (
                    <div
                        className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-md border shadow-lg animate-in fade-in slide-in-from-top-2 text-sm font-medium
            ${toast.type === "destructive" ? "bg-destructive/10 border-destructive text-destructive" : "bg-card border-border text-foreground"}
          `}
                    >
                        {toast.type === "destructive" ? <AlertTriangle className="w-4 h-4"/> :
                            <Check className="w-4 h-4 text-primary"/>}
                        {toast.message}
                    </div>
                )}

                <section className="space-y-4">
                    <h2 className="text-xs font-mono font-medium tracking-[0.2em] text-muted-foreground uppercase">
                        Security
                    </h2>

                    <div className="bg-background space-y-8">

                        <div className="flex flex-col gap-4 border-b border-border pb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        <Key className="w-4 h-4 text-muted-foreground"/>
                                        Authentication
                                    </div>
                                </div>
                                {!isResettingPassword && (
                                    <button
                                        onClick={() => setIsResettingPassword(true)}
                                        className="cursor-pointer text-sm px-4 py-2 rounded border border-primary text-primary hover:bg-primary/10 transition-colors w-full sm:w-auto"
                                    >
                                        Reset Password
                                    </button>
                                )}
                            </div>

                            {isResettingPassword && (
                                <form onSubmit={handlePasswordSubmit}
                                      className="bg-card border border-border p-4 sm:p-6 rounded-lg space-y-4 animate-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium">Update Password</h3>
                                        <button type="button" onClick={() => setIsResettingPassword(false)}
                                                className="text-muted-foreground hover:text-foreground">
                                            <X className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">Current Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={passwords.old}
                                                onChange={(e) => setPasswords({...passwords, old: e.target.value})}
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">New Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-muted-foreground">Confirm New
                                                Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                                                className="w-full bg-background border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        </div>
                                    </div>
                                    <div className="pt-2 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsResettingPassword(false)}
                                            className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
                                        >
                                            Save Password
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        <div className="flex flex-col gap-4 border-b border-border pb-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                                <div className="space-y-1">
                                    <div className="text-sm font-medium flex items-center gap-2">
                                        <MonitorSmartphone className="w-4 h-4 text-muted-foreground"/>
                                        Active Sessions
                                    </div>
                                    <div className="text-xs text-muted-foreground">Manage devices currently logged in to
                                        your account.
                                    </div>
                                </div>
                                <button
                                    onClick={handleLogoutDevices}
                                    className="cursor-pointer text-sm px-4 py-2 rounded border border-[#eab308]/50 text-[#eab308] hover:bg-[#eab308]/10 transition-colors w-full sm:w-auto"
                                >
                                    Log out of all devices
                                </button>
                            </div>

                            <div className="border border-border rounded-lg overflow-hidden bg-background">
                                {MOCK_SESSIONS.map((session) => {
                                    const {name: deviceName, icon: DeviceIcon} = parseUA(session.userAgent);
                                    return (
                                        <div key={session.id}
                                             className="flex items-center justify-between p-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="w-10 h-10 rounded bg-secondary flex items-center justify-center shrink-0">
                                                    <DeviceIcon className="w-5 h-5 text-muted-foreground"/>
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium flex items-center gap-2">
                                                        {deviceName}
                                                        {session.isCurrent && (
                                                            <span
                                                                className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded font-mono">
                    Current
                  </span>
                                                        )}
                                                    </div>
                                                    <div
                                                        className="text-xs text-muted-foreground flex items-center gap-2">
                                                        <span>{session.ipAddress}</span>
                                                        <span>•</span>
                                                        <span>Signed in {new Date(session.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {!session.isCurrent && (
                                                <button
                                                    onClick={() => showToast(`Revoking session: ${session.id}`, "default")}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    title="Revoke session"
                                                >
                                                    <X className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="pt-4">
                            <div
                                className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                                <div className="space-y-2 max-w-md">
                                    <div className="text-sm font-medium text-destructive flex items-center gap-2">
                                        <Trash2 className="w-4 h-4"/>
                                        Permanently Delete Account
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        This action is irreversible. It will permanently delete your account and wipe
                                        your associated data.
                                    </p>
                                </div>

                                {!isDeleting ? (
                                    <button
                                        onClick={() => setIsDeleting(true)}
                                        className="text-sm px-4 py-2 rounded bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white transition-colors w-full sm:w-auto shrink-0 whitespace-nowrap"
                                    >
                                        Delete Account
                                    </button>
                                ) : (
                                    <form onSubmit={handleDeleteAccount}
                                          className="w-full sm:w-auto space-y-3 animate-in fade-in">
                                        <div className="text-xs text-destructive font-medium">Type "DELETE" to confirm
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            pattern="DELETE"
                                            placeholder="DELETE"
                                            value={deleteConfirmText}
                                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                                            className="w-full sm:w-32 bg-background border border-destructive/50 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-destructive"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsDeleting(false);
                                                    setDeleteConfirmText("");
                                                }}
                                                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={deleteConfirmText !== "DELETE"}
                                                className="cursor-pointer px-3 py-1.5 text-xs rounded bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Confirm
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                </section>
            </div>
        </TabShell>
    );
}
