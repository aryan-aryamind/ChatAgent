import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, Upload, User as UserIcon } from 'lucide-react';
import { PageHeader } from '../page-header';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { GradientButton } from '../gradient-button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export function ProfileSettings() {
  const { user: authUser, loading: authLoading, refreshSession } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
  });

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
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
          });
          setPreviewImage(data.user.image || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authLoading]);

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        toast.error('Image size must be less than 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    // Validation for password if provided
    if (passwords.newPassword) {
      if (passwords.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters long');
        return;
      }
      if (passwords.newPassword !== passwords.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.fullName,
          image: previewImage,
          ...(passwords.newPassword && { password: passwords.newPassword }),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserProfile(data.user);
        setPasswords({ newPassword: '', confirmPassword: '' });
        await refreshSession();
        toast.success('Settings updated successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="p-8 max-w-4xl">
        <PageHeader title="Settings" description="Manage your account preferences" />
        <div className="text-center py-12">
          <p className="text-text-secondary">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title="Settings" description="Manage your account information and security" />

      <div className="space-y-8 mt-8">
        {/* Profile Information Section */}
        <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-primary/10">
              <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Profile Information</h3>
              <p className="text-sm text-text-muted">Update your public profile details</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-4">Profile Photo</label>
              <div className="flex items-center gap-6">
                <div className="relative group">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt={userProfile?.name || 'Profile'}
                      className="w-24 h-24 rounded-full object-cover ring-2 ring-primary/20 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary-foreground/20 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-2 ring-primary/20">
                      {getInitials(userProfile?.name, userProfile?.email)}
                    </div>
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-secondary/30 hover:bg-secondary/50 border-dashed"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </Button>
                  {previewImage && previewImage !== userProfile?.image && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setPreviewImage(userProfile?.image || null)}
                    >
                      Reset Photo
                    </Button>
                  )}
                  <p className="text-[10px] text-text-muted">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">Full Name</label>
                <Input
                  className="bg-secondary/30"
                  value={profileData.fullName}
                  placeholder="Your Name"
                  onChange={(e) =>
                    setProfileData({ ...profileData, fullName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 ml-1">Email Address</label>
                <Input
                  value={profileData.email}
                  disabled
                  className="bg-secondary/10 border-transparent text-text-muted cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-card rounded-xl p-8 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Lock className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Security</h3>
              <p className="text-sm text-text-muted">Change your password to keep your account secure</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-semibold mb-2 ml-1">New Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-secondary/30 pr-10"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 ml-1">Confirm New Password</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-secondary/30 pr-10"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, confirmPassword: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <div className="flex justify-end pt-4">
          <GradientButton
            onClick={handleSaveAll}
            className="w-full md:w-auto px-12 py-6 text-lg"
            disabled={saving}
          >
            {saving ? 'Saving changes...' : 'Save All Changes'}
          </GradientButton>
        </div>

        <div className="p-6 bg-secondary/20 rounded-xl border border-border/50">
          <p className="text-sm text-text-muted leading-relaxed italic text-center">
            Your personal information is kept secure and is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
