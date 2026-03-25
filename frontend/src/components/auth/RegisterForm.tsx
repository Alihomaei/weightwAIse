'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserRole, Language } from '@/lib/types';
import { UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('patient');
  const [languagePref, setLanguagePref] = useState<Language>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Username is required';
    if (username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
    if (!password) newErrors.password = 'Password is required';
    if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim(),
        password,
        role,
        full_name: fullName.trim(),
        language_preference: languagePref,
      });
    } catch {
      // Error handled in useAuth hook via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        type="text"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={errors.fullName}
        autoComplete="name"
        autoFocus
      />
      <Input
        label="Username"
        type="text"
        placeholder="Choose a username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={errors.username}
        autoComplete="username"
      />
      <Input
        label="Password"
        type="password"
        placeholder="Create a password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        autoComplete="new-password"
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        autoComplete="new-password"
      />

      {/* Role Selection */}
      <div>
        <label className="block text-sm font-medium text-medical-text mb-2">
          Account Type
        </label>
        <div className="flex gap-3">
          {(['patient', 'admin'] as UserRole[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all duration-200',
                role === r
                  ? 'border-primary-700 bg-primary-50 text-primary-800 ring-2 ring-primary-200'
                  : 'border-medical-border bg-white text-medical-muted hover:bg-gray-50'
              )}
            >
              {r === 'patient' ? 'Patient' : 'Administrator'}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-medium text-medical-text mb-2">
          Preferred Language
        </label>
        <div className="flex gap-3">
          {([
            { code: 'en' as Language, label: 'English' },
            { code: 'es' as Language, label: 'Espanol' },
          ]).map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLanguagePref(code)}
              className={cn(
                'flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all duration-200',
                languagePref === code
                  ? 'border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-200'
                  : 'border-medical-border bg-white text-medical-muted hover:bg-gray-50'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isSubmitting}
        icon={<UserPlus className="h-4 w-4" />}
        className="w-full"
      >
        Create Account
      </Button>
      <p className="text-center text-sm text-medical-muted">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-primary-700 font-medium hover:text-primary-800 transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}
