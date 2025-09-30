"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  User,
  DollarSign,
  Settings as SettingsIcon,
  Mail,
  Key,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { gradientFromString, initialsFromName } from "@/lib/avatar";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  createdAt: string;
  image?: string | null;
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    fetchProfile();
  }, [session, status, router]);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  // No profile image editing; avatar is initials over gradient

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert("Please fill out all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New password and confirmation do not match");
      return;
    }
    if (newPassword.length < 8) {
      alert("New password must be at least 8 characters");
      return;
    }
    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Password updated successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(data.message || data.error || "Failed to change password");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      alert("An unexpected error occurred");
    } finally {
      setChanging(false);
    }
  };

  if (loading || !session) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Loading settings...</div>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Profile not found
            </h1>
            <p className="text-gray-400">
              Unable to load your profile information.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-gray-400">Manage your account settings and preferences</p>
        </div>

        {/* Account Information */}
        <Card className="mb-6 bg-gray-800/90 border-0 shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Name
              </label>
              <div className="text-gray-300 bg-gray-800 px-3 py-2 rounded-md">
                {profile.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email Address
              </label>
              <div className="text-gray-300 bg-gray-800 px-3 py-2 rounded-md flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {profile.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Account Type
              </label>
              <div className="flex items-center gap-2">
                <Badge variant={profile.isAdmin ? "success" : "default"}>
                  {profile.isAdmin ? "Administrator" : "User"}
                </Badge>
                <span className="text-gray-400 text-sm">
                  Member since {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Avatar */}
        <Card className="mb-6 bg-gray-800/90 border-0 shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Avatar
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <div className="flex items-center gap-4">
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-lg font-semibold text-gray-900/90"
                style={gradientFromString(profile.id || profile.email || profile.name)}
              >
                {initialsFromName(profile.name)}
              </div>
              <div className="text-sm text-gray-400">
                Your avatar is generated automatically from your name.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="mb-6 bg-gray-800/90 border-0 shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-4">
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={changing || !currentPassword || !newPassword || !confirmPassword}>
                  {changing ? "Updating..." : "Change Password"}
                </Button>
              </div>
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-300">
                    <p className="mb-2"><strong>Tip:</strong> Use a unique passphrase you don&apos;t reuse elsewhere.</p>
                    <p className="text-xs text-gray-400">Minimum length is 8 characters.</p>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card className="bg-gray-800/90 border-0 shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="bg-red-600/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Account Deletion
                  </h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="no"
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    Delete Account (Coming Soon)
                  </Button>
                  <p className="text-gray-500 text-xs mt-2">
                    Account deletion feature will be available in a future update.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}