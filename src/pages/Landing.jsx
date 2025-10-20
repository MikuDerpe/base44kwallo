
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, ArrowRight, Sparkles, Lock, Zap, Crown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WHOP_CHECKOUT_LINKS = {
  starter: "https://whop.com/checkout/plan_4dDSD6EbTHMwH?d2c=true",
  pro: "https://whop.com/checkout/plan_Xf2DbBhzFieK3?d2c=true"
};

export default function Landing() {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Initialize Meta Pixel
  React.useEffect(() => {
    // Check if pixel is already loaded
    if (window.fbq) {
      window.fbq('track', 'PageView');
      return;
    }

    // Meta Pixel Code - This dynamically injects the script
    (function(f,b,e,v,n,t,s) {
      if(f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      };
      if(!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s)
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', '31761051790176342');
    window.fbq('track', 'PageView');
  }, []);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      }
      setIsLoading(false);
    };
    checkUser();
  }, []);

  const handleGetStarted = async () => {
    if (user) {
      window.location.href = createPageUrl("Dashboard");
    } else {
      try {
        if (window.fbq) {
          window.fbq('track', 'Lead');
        }
        
        await base44.auth.redirectToLogin();
      } catch (error) {
        console.error("Login error:", error);
      }
    }
  };

  const handlePlanSelect = (plan) => {
    if (plan === 'free') {
      handleGetStarted();
    } else {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          content_name: plan === 'starter' ? 'Starter Plan' : 'Pro Plan',
          value: plan === 'starter' ? 19.97 : 49.97,
          currency: 'EUR'
        });
      }
      
      let checkoutUrl = WHOP_CHECKOUT_LINKS[plan];
      if (user) {
        const returnUrl = encodeURIComponent(window.location.origin + '/account?whop_return=true');
        checkoutUrl += `&return_url=${returnUrl}`;
      }
      window.open(checkoutUrl, '_blank');
    }
  };

  const getButtonText = () => {
    if (isLoading) return "Loading...";
    if (user) return "Go to Dashboard";
    return "See the difference (takes 30 seconds)";
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Noscript fallback for Meta Pixel */}
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{display: 'none'}}
          src="https://www.facebook.com/tr?id=31761051790176342&ev=PageView&noscript=1"
          alt="Facebook Pixel"
        />
      </noscript>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-300/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <section className="relative py-20 sm:py-32">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
                You already know AI-generated content{' '}
                <span className="relative inline-block">
                  <span className="relative z-10">sounds fake.</span>
                  <span className="absolute bottom-2 left-0 w-full h-3 bg-gradient-to-r from-blue-300 to-pink-300 -rotate-1"></span>
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                Every time you use ChatGPT for a post, it comes back generic, corporate, lifeless. You know it. Your audience would know it. So you don't bother. And nothing gets posted.
              </p>

              <p className="text-xl sm:text-2xl font-semibold text-slate-900 mb-8">
                KWALLO fixes this. Not by being "smarter AI." But by making AI actually sound like you <span className="italic">before</span> it even writes.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
                <Button
                  size="lg"
                  className="relative group bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-lg px-8 py-6 shadow-2xl shadow-pink-500/30 w-full sm:w-auto overflow-hidden"
                  onClick={handleGetStarted}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                  <span className="relative z-10 flex items-center">
                    {getButtonText()}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </span>
                </Button>
              </div>
              
              <p className="text-sm text-slate-500">
                Try 15 free generations. No credit card. See if this is actually different.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
                This is the critical moment. See the difference:
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-2 border-slate-300 bg-slate-50 relative">
                  <div className="absolute -top-3 left-4 bg-slate-700 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    What ChatGPT gives you
                  </div>
                  <CardContent className="p-6 pt-8">
                    <div className="prose prose-sm text-slate-600">
                      <p>"In today's fast-paced digital landscape, content creation has become increasingly important.</p>
                      <p>If you're looking to grow your audience and increase engagement, a strategic approach is essential.</p>
                      <p>Consider implementing these best practices..."</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-slate-500">
                      <X className="w-5 h-5 text-red-500" />
                      <span className="text-sm">Sounds like a robot</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gradient-to-r from-blue-400 to-pink-400 bg-gradient-to-br from-blue-50/50 to-pink-50/50 relative shadow-xl shadow-pink-200/50">
                  <div className="absolute -top-3 left-4 bg-gradient-to-r from-blue-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    What KWALLO gives you
                  </div>
                  <CardContent className="p-6 pt-8">
                    <div className="prose prose-sm text-slate-900">
                      <p className="font-medium">"I used to think more followers meant more money. I was wrong.</p>
                      <p>It wasn't until my 10th client that I realized something: the people who actually bought from me weren't my biggest fans—they were the ones who trusted me enough to listen to my advice.</p>
                      <p>Here's what changed everything..."</p>
                    </div>
                    <div className="mt-6 flex items-center gap-2 text-emerald-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-semibold">Sounds like a human who sells things</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <p className="text-center mt-8 text-xl font-semibold text-slate-700">
                One sounds like a robot. One sounds like a human who sells things.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">
                  Guess which one converts?
                </span>
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-slate-50 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 text-center">
                Here's why every AI tool makes you sound like a corporate handbook
              </h2>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200">
                <p className="text-lg text-slate-700 mb-6">
                  When you type "write me a post about my course" into ChatGPT, it has <span className="font-bold text-slate-900">NO IDEA:</span>
                </p>
                <ul className="space-y-3 text-slate-700">
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span>Who your audience is</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span>What your actual voice sounds like</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span>What results your students actually get</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span>Why someone would care about YOUR course vs anyone else's</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span>What your niche responds to</span>
                  </li>
                </ul>
                <p className="text-lg text-slate-900 font-semibold mt-8">
                  So it defaults to generic. Safe. Boring. Unusable.
                </p>
                <p className="text-slate-700 mt-4">
                  You end up spending 2 hours rewriting AI output. Defeating the entire purpose.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12 text-center">
                KWALLO knows you <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">before</span> it writes
              </h2>

              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {[
                  {
                    title: "You fill out your 'brain'",
                    desc: "10 minutes. Your business, audience, voice, results, offers",
                    icon: "1"
                  },
                  {
                    title: "KWALLO learns this once",
                    desc: "Permanently stored. Never needs to be repeated.",
                    icon: "2"
                  },
                  {
                    title: "Every post has YOU built in",
                    desc: "No more context. No more explaining. Just create.",
                    icon: "3"
                  }
                ].map((step, idx) => (
                  <Card key={idx} className="border-2 border-slate-200 hover:border-blue-300 transition-all hover:shadow-xl">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-pink-500 text-white flex items-center justify-center font-bold text-xl mb-4">
                        {step.icon}
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-slate-900">{step.title}</h3>
                      <p className="text-slate-600">{step.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-pink-50 rounded-2xl p-8 border-2 border-blue-200">
                <h3 className="font-bold text-2xl mb-6 text-slate-900">What that means:</h3>
                <p className="text-lg mb-4 text-slate-700">
                  When you say "post about why people procrastinate," KWALLO doesn't just generate a post. It generates:
                </p>
                <ul className="space-y-3 text-slate-700 mb-8">
                  {[
                    "A post that sounds like YOU (not a template)",
                    "Tailored to YOUR audience's specific fears",
                    "That mentions YOUR results/proof points",
                    "In YOUR actual voice (because it studied your examples)",
                    "Trained on 1,000+ posts that actually went viral and converted in YOUR niche"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xl font-bold text-slate-900">
                  You're not getting AI. You're getting AI that already knows everything about you.
                </p>
              </div>

              <div className="mt-12 text-center bg-white rounded-xl p-8 shadow-lg border-2 border-slate-200">
                <h3 className="font-bold text-xl mb-4 text-slate-900">The difference:</h3>
                <div className="space-y-3 text-left max-w-2xl mx-auto">
                  <div className="flex items-start gap-3">
                    <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-1" />
                    <span className="text-slate-700"><span className="font-semibold">ChatGPT:</span> Generic AI + your prompt = Generic output</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-1" />
                    <span className="text-slate-900 font-medium"><span className="font-bold">KWALLO:</span> Your entire business context + AI + your prompt = Your voice, amplified</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-12 text-center">
                Here's what happens when AI actually sounds like you
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    name: "Joshua",
                    role: "Coach",
                    result: "€0 → €3k/month in 3 months",
                    quote: "I tried KWALLO expecting the same generic AI garbage I'd gotten before. Instead, it felt like... me? Like someone had studied how I actually talk about my coaching and was helping me say it at scale. I went from posting once a week (because each post took forever) to 5 posts a week. First month: 2 inquiries. Second month: 6. Third month: closed 3 high-ticket clients. The algorithm rewards consistency. KWALLO made me consistent."
                  },
                  {
                    name: "Hudson",
                    role: "E-Commerce Creator",
                    result: "15K → 127K followers in 4 months",
                    quote: "Everyone said 'just post more.' But more generic content isn't better, it's just more garbage. KWALLO changed that because every post actually felt like me. People started asking 'where are you getting these ideas?' because they didn't sound like typical Instagram advice. They sounded like someone who actually does this. Because the posts came from someone who does."
                  },
                  {
                    name: "Joana",
                    role: "Course Creator",
                    result: "One course launch",
                    quote: "I was terrified my course would get lost in the noise. But if I posted 5-10 times a week about the problem my course solves, with my actual voice, I could actually cut through. KWALLO let me do that without me spending 20 hours writing posts. Sold out the beta in 2 weeks. Second cohort in 6 weeks."
                  }
                ].map((testimonial, idx) => (
                  <Card key={idx} className="border-2 border-slate-200 bg-white hover:shadow-xl transition-shadow">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h4 className="font-bold text-lg text-slate-900">{testimonial.name}</h4>
                        <p className="text-sm text-slate-600">{testimonial.role}</p>
                        <p className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600 mt-1">
                          {testimonial.result}
                        </p>
                      </div>
                      <p className="text-slate-700 italic">"{testimonial.quote}"</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section id="pricing" className="py-20 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 text-center">
                Price that won't make you question it
              </h2>
              <p className="text-xl text-slate-600 text-center mb-12">
                One hour of your time = €50. KWALLO saves you 10+ hours/week. The math is obvious.
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                <Card className="border-2 border-slate-300 relative">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">FREE</h3>
                    <div className="text-4xl font-bold mb-6 text-slate-900">€0</div>
                    <ul className="space-y-3 mb-8">
                      {[
                        "15 test generations",
                        "See how it actually works",
                        "No credit card"
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handlePlanSelect('free')}
                    >
                      Try Free
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-4 border-blue-400 relative shadow-2xl shadow-blue-300/50 scale-105">
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <div className="bg-gradient-to-r from-blue-500 to-pink-500 text-white px-6 py-2 text-sm font-bold rounded-full shadow-lg">
                      Best for creators
                    </div>
                  </div>
                  <CardContent className="p-8 pt-12">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">STARTER</h3>
                    <div className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-pink-600">€19.97<span className="text-xl text-slate-600">/month</span></div>
                    <p className="text-sm text-slate-500 mb-6">~500 generations/month</p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "1 business profile",
                        "Your voice learned once",
                        "Social posts",
                        "Instagram stories",
                        "YouTube scripts",
                        "Ad copy",
                        "VSL templates",
                        "AI strategy chat",
                        "Content Calendar System",
                        "Quick Actions"
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-900 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 shadow-lg"
                      onClick={() => handlePlanSelect('starter')}
                    >
                      Start Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-400 relative">
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-2 text-slate-900">PRO</h3>
                    <div className="text-4xl font-bold mb-2 text-slate-900">€49.97<span className="text-xl text-slate-600">/month</span></div>
                    <p className="text-sm text-slate-500 mb-6">~5,000 generations/month</p>
                    <ul className="space-y-3 mb-8">
                      {[
                        "10 business profiles",
                        "Everything in Starter",
                        "Multi-brand management",
                        "Priority support",
                        "Early feature access",
                        "Custom templates"
                      ].map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <span className="text-slate-900 font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                      onClick={() => handlePlanSelect('pro')}
                    >
                      Scale Your Brands
                    </Button>
                    <p className="text-xs text-slate-500 text-center mt-3">For agencies & multi-brand creators</p>
                  </CardContent>
                </Card>
              </div>

              <p className="text-center mt-8 text-slate-600">
                Launch pricing. Price increases as we add features. Lock in €19 now.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                Every day you don't post, someone else is.
              </h2>
              <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed">
                Your competitors aren't waiting for perfect AI. They're posting 3-5 times a week with whatever they can make work.
              </p>
              <p className="text-xl text-white font-semibold mb-6">
                The algorithm doesn't reward perfection. It rewards consistency.
              </p>
              <p className="text-2xl text-white font-bold mb-8">
                KWALLO makes consistency possible.
              </p>
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-slate-100 text-xl px-10 py-7 shadow-2xl mb-6"
                onClick={handleGetStarted}
              >
                Try 15 Generations Free
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>
              <p className="text-white/80 text-sm mb-4">
                15 free generations. No card. 2 minutes setup. Find out if this actually sounds like you.
              </p>
              <p className="text-white/70 text-sm max-w-xl mx-auto">
                The worst case? You spend 15 minutes and realize it's not for you. The best case? You realize why everyone else is leaving you behind.
              </p>
            </motion.div>
          </div>
        </section>

        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Stop sounding like a robot. Start sounding like you.</h3>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Refund Policy</a>
              <a href="mailto:support@kwallo.com" className="hover:text-white transition-colors">Support</a>
            </div>
            <div className="text-center mt-8 text-slate-500 text-sm">
              <p>&copy; 2024 KWALLO. All rights reserved.</p>
            </div>
          </div>
        </footer>
    </div>
  );
}
