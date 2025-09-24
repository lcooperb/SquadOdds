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

interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string;
  virtualBalance: number;
  isAdmin: boolean;
  createdAt: string;
}

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Display Name
                </label>
                <div className="text-gray-300 bg-gray-800 px-3 py-2 rounded-md">
                  {profile.displayName}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Username
                </label>
                <div className="text-gray-300 bg-gray-800 px-3 py-2 rounded-md">
                  @{profile.username}
                </div>
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

        {/* Balance Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Account Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
              <div>
                <div className="text-2xl font-bold text-green-400">
                  ₺{profile.virtualBalance.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  Current Balance (${(profile.virtualBalance/100).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} USD)
                </div>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => router.push("/topup")}
                >
                  Add Tokens
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/redeem")}
                >
                  Redeem
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-600/10 border border-blue-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white font-medium mb-1">
                    Password Management
                  </h4>
                  <p className="text-gray-300 text-sm mb-3">
                    Your account is secured with NextAuth. Password changes and account security
                    are managed through your authentication provider.
                  </p>
                  <p className="text-gray-400 text-xs">
                    For enhanced security, consider enabling two-factor authentication with your provider.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-5 w-5" />
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                    variant="destructive"
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