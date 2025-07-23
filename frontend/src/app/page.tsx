'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from "motion/react";
import { LinkIcon, BugAntIcon } from '@heroicons/react/24/solid'
import { LoadingSpinner } from './components/loading-spinner';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(true);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setIsSubmitting(true);
    try {
      // call api for link analysis
      // use id returned
      const resultId=1;
      router.push(`/result/${resultId}`);
    } catch (error) {
      console.error('ERROR', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-neutral-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm"
          >
            <LinkIcon className="h-8 w-8 text-white" />
          </motion.div>

          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            Crawl your link
          </h1>
          <p className="mb-12 text-xl text-neutral-400">
            Enter a URL below to get analysis of your link.
          </p>

          <motion.form
            onSubmit={handleSubmit}
            className="mx-auto max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full rounded-full border border-neutral-700 bg-neutral-900/50 px-6 py-4 text-lg backdrop-blur-sm placeholder:text-neutral-500 focus:border-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <motion.button
                type="submit"
                disabled={!url.trim() || isSubmitting}
                className="group relative flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-medium text-black transition-all hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    Analyze
                    <BugAntIcon className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3"
          >
            {[
              { title: 'Links', desc: 'External and internal links' },
              { title: 'Content', desc: 'HTML tags and structure' },
              { title: 'Status', desc: 'Availability & error checking' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                className="rounded-lg border border-neutral-800 bg-neutral-900/30 p-6 backdrop-blur-sm hover:border-white transition-colors"
              >
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-neutral-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}