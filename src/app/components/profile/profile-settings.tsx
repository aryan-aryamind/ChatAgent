import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { PageHeader } from '../page-header';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  accounts?: Array<{
    provider: string;
    type: string;
  }>;
}

export function ProfileSettings() {
  const { user: authUser, loading: authLoading, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    language: 'en',
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Get user initials for avatar
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (authLoading) return;

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.user);
          setProfileData({
            fullName: data.user.name || '',
            email: data.user.email || '',
            phone: '+1 (555) 123-4567', // Phone not in DB yet
            timezone: 'America/New_York',
            language: 'en',
          });
        } else {
          toast.error('Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading]);

  // Handle save profile
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.fullName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        // Refresh the session to update the sidebar
        await refreshSession();
        toast.success('Profile updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="p-8 max-w-4xl">
        <PageHeader title="Profile Settings" description="Manage your account settings" />
        <div className="text-center py-12">
          <p className="text-text-secondary">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Profile Settings" description="Manage your account settings" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-6">Profile Information</h3>

            {/* Profile Photo */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Profile Photo</label>
              <div className="flex items-center gap-4">
                {userProfile?.image ? (
                  <img
                    src={userProfile.image}
                    alt={userProfile.name || 'Profile'}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-2xl font-bold">
                    {getInitials(userProfile?.name, userProfile?.email)}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="bg-transparent" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  {userProfile?.image && (
                    <Button variant="outline" size="sm" className="bg-transparent" disabled>
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Full Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                value={profileData.fullName}
                onChange={(e) =>
                  setProfileData({ ...profileData, fullName: e.target.value })
                }
              />
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="flex items-center gap-2">
                <Input value={profileData.email} disabled className="flex-1" />
                {userProfile?.emailVerified ? (
                  <span className="text-sm text-success">✓ Verified</span>
                ) : (
                  <span className="text-sm text-warning">Not Verified</span>
                )}
              </div>
            </div>
            
            {/* Account Type */}
            {userProfile?.accounts && userProfile.accounts.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Sign-in Method</label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={userProfile.accounts.map(acc => acc.provider.charAt(0).toUpperCase() + acc.provider.slice(1)).join(', ')} 
                    disabled 
                    className="flex-1" 
                  />
                </div>
              </div>
            )}
            
            {/* Account Created */}
            {userProfile?.createdAt && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Member Since</label>
                <Input 
                  value={new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} 
                  disabled 
                  className="flex-1" 
                />
              </div>
            )}

            {/* Phone */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Phone Number (Optional)
              </label>
              <Input
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
            </div>

            {/* Timezone */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Time Zone</label>
              <Select value={profileData.timezone} onValueChange={(value) =>
                  setProfileData({ ...profileData, timezone: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago (CST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">
                    America/Los Angeles (PST)
                  </SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Language</label>
              <Select
                value={profileData.language}
                onValueChange={(value) =>
                  setProfileData({ ...profileData, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <GradientButton onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </GradientButton>
          </div>
        </TabsContent>

        <TabsContent value="workspace" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-6">Workspace Information</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Workspace Name</label>
              <Input defaultValue="My Company" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Workspace ID</label>
              <div className="flex items-center gap-2">
                <Input value="ws_1234567890abcdef" disabled />
                <Button variant="outline" size="sm" className="bg-transparent">
                  Copy
                </Button>
              </div>
            </div>

            {userProfile?.createdAt && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Created</label>
                <p className="text-text-secondary">
                  {new Date(userProfile.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}

            <GradientButton onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </GradientButton>
          </div>

          {/* Workspace Members */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold">Workspace Members</h3>
                <p className="text-sm text-text-secondary">Standard Plan (3 seats)</p>
              </div>
              <Button variant="outline" className="bg-transparent">
                Upgrade
              </Button>
            </div>

            <div className="space-y-3">
              {[
                { name: 'John Smith (You)', email: 'john@company.com', role: 'Owner' },
                { name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin' },
                { name: 'Mike Davis', email: 'mike@company.com', role: 'Member' },
              ].map((member, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{member.name}</div>
                      <div className="text-xs text-text-muted">{member.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-text-secondary">{member.role}</div>
                </div>
              ))}
            </div>

            <Button variant="outline" className="w-full mt-4 bg-transparent">
              + Invite Member
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border">
            <h3 className="font-semibold mb-6">Password & Security</h3>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border mb-4">
              <div>
                <div className="font-medium">Password</div>
                <div className="text-sm text-text-muted">••••••••••••</div>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent">
                Change Password
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-border mb-4">
              <div>
                <div className="font-medium">Two-Factor Authentication</div>
                <div className="text-sm text-text-muted">Status: Disabled</div>
              </div>
              <Button variant="outline" size="sm" className="bg-transparent">
                Enable 2FA
              </Button>
            </div>

            <div>
              <h4 className="font-medium mb-3">Active Sessions</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium text-sm">Chrome on Windows (Current)</div>
                    <div className="text-xs text-text-muted">Last seen: Now</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <div>
                    <div className="font-medium text-sm">Safari on iPhone</div>
                    <div className="text-xs text-text-muted">Last seen: 2 hours ago</div>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-4 bg-transparent">
                Sign Out All Devices
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
