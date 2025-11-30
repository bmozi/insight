'use client';

import { useState } from 'react';
import {
  Cookie,
  Eye,
  Shield,
  Target,
  Building2,
  Clock,
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Fingerprint,
  TrendingUp,
  Users,
  ShoppingCart,
  BarChart3,
  Zap,
} from 'lucide-react';

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100 text-purple-600">
            {icon}
          </div>
          <span className="font-semibold text-gray-800 text-left">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6 pt-2 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

interface InfoCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'purple' | 'blue' | 'green' | 'red' | 'orange' | 'cyan';
}

function InfoCard({ icon, title, description, color }: InfoCardProps) {
  const colorClasses = {
    purple: 'bg-purple-100 text-purple-600 border-purple-200',
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    red: 'bg-red-100 text-red-600 border-red-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200',
  };

  return (
    <div className={`rounded-2xl p-5 border-2 ${colorClasses[color]} bg-opacity-50`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function LearnPrivacy() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-700 p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
            <Cookie className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Understanding Browser Cookies</h1>
            <p className="text-white/80 text-lg">Learn how your data is collected and used online</p>
          </div>
        </div>
        <p className="text-white/90 max-w-3xl">
          Every time you browse the web, small pieces of data called cookies are stored in your browser.
          While some are essential for websites to function, others track your every move across the internet.
          Understanding cookies is the first step to taking control of your digital privacy.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white/95 p-5 shadow-lg text-center">
          <div className="text-3xl font-bold text-purple-600 mb-1">80%</div>
          <div className="text-sm text-gray-600">of websites use tracking cookies</div>
        </div>
        <div className="rounded-2xl bg-white/95 p-5 shadow-lg text-center">
          <div className="text-3xl font-bold text-red-500 mb-1">$200B+</div>
          <div className="text-sm text-gray-600">digital ad industry value</div>
        </div>
        <div className="rounded-2xl bg-white/95 p-5 shadow-lg text-center">
          <div className="text-3xl font-bold text-orange-500 mb-1">2+ years</div>
          <div className="text-sm text-gray-600">some cookies persist</div>
        </div>
        <div className="rounded-2xl bg-white/95 p-5 shadow-lg text-center">
          <div className="text-3xl font-bold text-blue-600 mb-1">1000s</div>
          <div className="text-sm text-gray-600">of data points collected</div>
        </div>
      </div>

      {/* What Are Cookies */}
      <div className="rounded-3xl bg-white/95 p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Cookie className="h-7 w-7 text-purple-600" />
          What Are Cookies?
        </h2>
        <p className="text-gray-600 mb-6 text-lg">
          Cookies are small text files (typically less than 4KB) that websites store in your browser.
          They contain data like preferences, login tokens, and tracking identifiers.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            title="Session Cookies"
            description="Temporary cookies deleted when you close your browser. Used for shopping carts and login sessions."
            color="green"
          />
          <InfoCard
            icon={<Lock className="h-5 w-5" />}
            title="Persistent Cookies"
            description="Remain on your device for a set period. Used for 'Remember Me' features and preferences."
            color="blue"
          />
          <InfoCard
            icon={<Globe className="h-5 w-5" />}
            title="First-Party Cookies"
            description="Set by the website you're visiting. Generally used for essential site functionality."
            color="purple"
          />
          <InfoCard
            icon={<Eye className="h-5 w-5" />}
            title="Third-Party Cookies"
            description="Set by external domains (ads, analytics). These are the primary tracking mechanism."
            color="red"
          />
        </div>
      </div>

      {/* How Companies Use Cookies */}
      <div className="rounded-3xl bg-white/95 p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Building2 className="h-7 w-7 text-blue-600" />
          How Companies Use Cookies
        </h2>

        <div className="space-y-4">
          <AccordionItem
            title="Legitimate & Essential Uses"
            icon={<CheckCircle className="h-5 w-5" />}
            defaultOpen={true}
          >
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50">
                <Lock className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Authentication</h4>
                  <p className="text-sm text-gray-600">Keeps you logged in as you navigate pages</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50">
                <ShoppingCart className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Shopping Cart</h4>
                  <p className="text-sm text-gray-600">Remembers items while you browse</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Security</h4>
                  <p className="text-sm text-gray-600">CSRF tokens prevent malicious attacks</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-green-50">
                <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-800">Preferences</h4>
                  <p className="text-sm text-gray-600">Language, theme, and display settings</p>
                </div>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Analytics & Performance Tracking"
            icon={<BarChart3 className="h-5 w-5" />}
          >
            <div className="space-y-4 mt-4">
              <p className="text-gray-600">
                Companies like Google Analytics track how you interact with websites to help site owners understand user behavior.
              </p>
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-2">What they collect:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>- Pages visited and time spent on each</li>
                  <li>- How you arrived (search, link, direct)</li>
                  <li>- Device type, browser, screen size</li>
                  <li>- Geographic location (city/country level)</li>
                  <li>- Clicks, scrolls, and interactions</li>
                </ul>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Advertising & Behavioral Targeting"
            icon={<Target className="h-5 w-5" />}
          >
            <div className="space-y-4 mt-4">
              <p className="text-gray-600">
                This is where privacy concerns become serious. Ad networks track you across millions of websites to build detailed profiles.
              </p>

              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  How Cross-Site Tracking Works
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span className="text-gray-700">You visit <strong>shoes.com</strong> - A Facebook pixel drops a cookie</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span className="text-gray-700">You visit <strong>news.com</strong> - Same Facebook pixel reads that cookie</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span className="text-gray-700">Facebook now knows you visited both sites and links them</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">4</span>
                    <span className="text-gray-700">You see shoe ads on Facebook, Instagram, and partner sites</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <h5 className="font-medium text-orange-800 mb-1">Retargeting</h5>
                  <p className="text-xs text-gray-600">Shows ads for products you viewed elsewhere</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <h5 className="font-medium text-orange-800 mb-1">Audience Building</h5>
                  <p className="text-xs text-gray-600">Creates profiles of interests & demographics</p>
                </div>
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <h5 className="font-medium text-orange-800 mb-1">Attribution</h5>
                  <p className="text-xs text-gray-600">Tracks which ad led to a purchase</p>
                </div>
              </div>
            </div>
          </AccordionItem>

          <AccordionItem
            title="Fingerprinting & Advanced Tracking"
            icon={<Fingerprint className="h-5 w-5" />}
          >
            <div className="space-y-4 mt-4">
              <p className="text-gray-600">
                Even if you block cookies, companies can still identify you through browser fingerprinting -
                collecting device characteristics that make your browser unique.
              </p>

              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-medium text-gray-800 mb-2">Fingerprint components:</h4>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>- Screen resolution & color depth</div>
                  <div>- Installed fonts & plugins</div>
                  <div>- Browser version & settings</div>
                  <div>- Hardware (GPU, CPU cores)</div>
                  <div>- Timezone & language</div>
                  <div>- Canvas & WebGL rendering</div>
                </div>
              </div>

              <p className="text-sm text-gray-500 italic">
                Combined, these create a nearly unique identifier that persists even after clearing cookies.
              </p>
            </div>
          </AccordionItem>
        </div>
      </div>

      {/* Major Players */}
      <div className="rounded-3xl bg-white/95 p-8 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Users className="h-7 w-7 text-orange-600" />
          Major Tracking Companies
        </h2>
        <p className="text-gray-600 mb-6">
          A handful of companies dominate web tracking, appearing on millions of websites:
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Google', domains: 'google-analytics.com, doubleclick.net, googlesyndication.com', reach: '~85% of websites' },
            { name: 'Meta (Facebook)', domains: 'facebook.net, facebook.com pixel', reach: '~30% of websites' },
            { name: 'Amazon', domains: 'amazon-adsystem.com', reach: '~15% of websites' },
            { name: 'Microsoft', domains: 'clarity.ms, bing.com', reach: '~10% of websites' },
            { name: 'Adobe', domains: 'demdex.net, omtrdc.net', reach: '~8% of websites' },
            { name: 'Oracle', domains: 'bluekai.com, addthis.com', reach: '~5% of websites' },
          ].map((company) => (
            <div key={company.name} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <h4 className="font-semibold text-gray-800">{company.name}</h4>
              <p className="text-xs text-gray-500 mb-2">{company.domains}</p>
              <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-medium">
                {company.reach}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Concerns */}
      <div className="rounded-3xl bg-gradient-to-br from-red-500 to-orange-600 p-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <AlertTriangle className="h-7 w-7" />
          Privacy Concerns
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
            <h4 className="font-semibold mb-2">Consent Issues</h4>
            <p className="text-white/80 text-sm">
              Most tracking happens without meaningful consent. Cookie banners often use dark patterns
              to trick users into accepting all cookies.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
            <h4 className="font-semibold mb-2">Data Brokers</h4>
            <p className="text-white/80 text-sm">
              Your browsing data is often sold to data brokers who aggregate it with other sources
              to build comprehensive profiles.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
            <h4 className="font-semibold mb-2">Sensitive Profiling</h4>
            <p className="text-white/80 text-sm">
              Profiles can reveal sensitive information: health conditions, political views,
              financial status, and personal relationships.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
            <h4 className="font-semibold mb-2">Security Risks</h4>
            <p className="text-white/80 text-sm">
              Large databases of personal information are attractive targets for hackers,
              leading to data breaches affecting millions.
            </p>
          </div>
        </div>
      </div>

      {/* Take Action */}
      <div className="rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 p-8 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
          <Shield className="h-7 w-7" />
          Take Control with Insight
        </h2>
        <p className="text-white/90 mb-6 text-lg">
          Now that you understand how tracking works, use Insight to see exactly what's happening
          in your browser and take action.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-center">
            <Eye className="h-8 w-8 mx-auto mb-3" />
            <h4 className="font-semibold mb-1">See Everything</h4>
            <p className="text-white/80 text-sm">View all cookies and trackers on your browser</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-center">
            <Target className="h-8 w-8 mx-auto mb-3" />
            <h4 className="font-semibold mb-1">Identify Threats</h4>
            <p className="text-white/80 text-sm">Know which companies are tracking you</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-5 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-3" />
            <h4 className="font-semibold mb-1">Track Progress</h4>
            <p className="text-white/80 text-sm">Monitor your privacy score over time</p>
          </div>
        </div>
      </div>
    </div>
  );
}
