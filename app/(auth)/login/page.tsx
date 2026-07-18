'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { motion, type Variants } from 'motion/react';
import { GoogleIcon, GithubIcon } from '@/components/icons';
import Image from 'next/image';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'signin' | 'signup';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Login page — animated split-screen layout.
 * Form logic is kept inline to own the Motion animation lifecycle cleanly.
 */
export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('signin');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setPending(true);

    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    try {
      if (tab === 'signin') {
        const { error: authError } = await authClient.signIn.email({ email, password });
        if (authError) {
          setError(authError.message ?? 'Invalid credentials.');
          return;
        }
      } else {
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const { error: authError } = await authClient.signUp.email({ name, email, password });
        if (authError) {
          setError(authError.message ?? 'Could not create account.');
          return;
        }
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setPending(true);
    try {
      await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
    } catch {
      setError('Google sign-in failed.');
      setPending(false);
    }
  }

  async function handleGithub() {
    setPending(true);
    try {
      await authClient.signIn.social({ provider: 'github', callbackURL: '/' });
    } catch {
      setError('GitHub sign-in failed.');
      setPending(false);
    }
  }

  function switchTab(newTab: Tab) {
    setTab(newTab);
    setError('');
  }

  return (
    <div className="flex h-svh w-full overflow-hidden bg-white font-sans text-neutral-950 antialiased selection:bg-neutral-900 selection:text-white relative">
      {/* Left — form */}
      <div className="flex h-full w-full flex-col overflow-y-auto lg:w-1/2">
        <div className="flex flex-1 items-center justify-center p-6 md:p-10 mt-4 md:mt-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[420px]"
          >
            {/* Logo & title */}
            <motion.div
              variants={itemVariants}
              className="mb-6 flex flex-col items-center text-center"
            >
              <Link href="/" className="mb-6 cursor-pointer">
                <Image src="/logo.png" alt="Mentis Logo" width={64} height={64} className="object-contain" priority />
              </Link>
              <h1 className="mb-1 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
                {tab === 'signin' ? 'Welcome Back' : 'Create your Account'}
              </h1>
              <p className="text-sm text-neutral-500">
                {tab === 'signin'
                  ? 'Sign in to continue to Mentis AI'
                  : "Let's get started with your Mentis AI account"}
              </p>
            </motion.div>

            {/* Social buttons */}
            <motion.div variants={itemVariants} className="mb-4 flex flex-row gap-3">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={pending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50"
              >
                <GoogleIcon className="text-lg" />
                Google
              </button>
              <button
                type="button"
                onClick={handleGithub}
                disabled={pending}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 active:bg-neutral-100 disabled:opacity-50"
              >
                <GithubIcon className="text-lg" />
                GitHub
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div variants={itemVariants} className="relative mb-6 flex items-center">
              <div className="grow border-t border-neutral-200" />
              <span className="px-4 text-sm text-neutral-400">or continue with email</span>
              <div className="grow border-t border-neutral-200" />
            </motion.div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {tab === 'signup' && (
                <motion.div variants={itemVariants} className="flex flex-col gap-2">
                  <label htmlFor="name" className="text-sm font-medium text-neutral-800">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Enter your name"
                    className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  />
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-neutral-800">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col gap-2">
                <label htmlFor="password" className="text-sm font-medium text-neutral-800">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="Enter your password"
                  className="w-full rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm text-neutral-900 placeholder:text-neutral-300 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </motion.div>

              {tab === 'signup' && (
                <motion.div variants={itemVariants} className="flex items-start gap-3">
                  <div className="flex h-5 items-center">
                    <input
                      id="terms"
                      type="checkbox"
                      required
                      className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                    />
                  </div>
                  <label htmlFor="terms" className="text-sm text-neutral-600">
                    I agree to all Terms, Privacy Policy and Fees
                  </label>
                </motion.div>
              )}

              {error && (
                <motion.div variants={itemVariants}>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="mt-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-linear-to-b from-[#3a3a3a] to-[#121212] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  {pending ? 'Please wait...' : tab === 'signin' ? 'Log in' : 'Sign Up'}
                </button>
              </motion.div>
            </form>

            {/* Footer tab switch */}
            <motion.div
              variants={itemVariants}
              className="mt-5 text-sm text-neutral-500 text-center"
            >
              {tab === 'signin' ? (
                <>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('signup')}
                    className="font-semibold text-neutral-900 hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchTab('signin')}
                    className="font-semibold text-neutral-900 hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Right — decorative image (desktop only) */}
      <div className="hidden lg:block lg:w-1/2 p-4">
        <div className="relative h-full w-full overflow-hidden rounded-[2rem]">
          <Image
            src="/auth.avif"
            alt="Cloudscape background"
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
