'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { useLanguageStore } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';
import { FullPageSpinner } from '@/components/ui/Spinner';
import Image from 'next/image';
import { Globe, Activity, Shield, MessageCircle } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { language, setLanguage } = useLanguageStore();
  const [showRegister, setShowRegister] = useState(false);

  // Redirect authenticated users
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/chat');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <FullPageSpinner message="Loading..." />;
  }

  if (user) {
    return <FullPageSpinner message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-800 via-primary-900 to-primary-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-teal-400 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-2">
            <Image
              src="/logo.png"
              alt="WeightwAIse Logo"
              width={180}
              height={80}
              className="brightness-0 invert"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <h2 className="text-2xl font-semibold leading-snug">
            Evidence-based guidance for
            <br />
            weight management decisions
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: <MessageCircle className="h-5 w-5" />,
                title: 'Guided Consultation',
                desc: 'Structured intake and personalized assessment via AI chat',
              },
              {
                icon: <Activity className="h-5 w-5" />,
                title: 'Clinical Decision Support',
                desc: 'Recommendations grounded in surgical guidelines and PubMed literature',
              },
              {
                icon: <Shield className="h-5 w-5" />,
                title: 'Multilingual Support',
                desc: 'Full English and Spanish voice & text interaction',
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-teal-300">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-medium text-sm">{feature.title}</h3>
                  <p className="text-xs text-primary-200 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs text-primary-300">
            This is a research prototype for educational purposes only.
            <br />
            Not intended to replace professional medical advice.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex flex-col">
        {/* Top bar with language selector */}
        <div className="flex justify-between items-center px-6 py-4">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <Image
              src="/logo.png"
              alt="WeightwAIse Logo"
              width={120}
              height={53}
              priority
            />
          </div>
          <div className="lg:ml-auto" />

          {/* Language toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-medical-border text-sm font-medium text-medical-muted hover:bg-gray-50 transition-colors"
          >
            <Globe className="h-4 w-4" />
            {language === 'en' ? 'English' : 'Espanol'}
          </button>
        </div>

        {/* Form Area */}
        <div className="flex-1 flex items-center justify-center px-6 pb-8">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-medical-text">
                {showRegister
                  ? language === 'en'
                    ? 'Create Account'
                    : 'Crear Cuenta'
                  : language === 'en'
                    ? 'Welcome Back'
                    : 'Bienvenido'}
              </h2>
              <p className="text-sm text-medical-muted mt-1">
                {showRegister
                  ? language === 'en'
                    ? 'Get started with your consultation'
                    : 'Comience con su consulta'
                  : language === 'en'
                    ? 'Sign in to continue your consultation'
                    : 'Inicie sesion para continuar su consulta'}
              </p>
            </div>

            {/* Form */}
            {showRegister ? (
              <RegisterForm onSwitchToLogin={() => setShowRegister(false)} />
            ) : (
              <LoginForm onSwitchToRegister={() => setShowRegister(true)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
