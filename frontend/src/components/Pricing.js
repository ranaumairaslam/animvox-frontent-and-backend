"use client";

import { motion } from "framer-motion";
import { FaCheck, FaRocket, FaStar, FaBuilding, FaArrowRight } from "react-icons/fa";

const plans = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    tagline: "Perfect to get started",
    icon: <FaRocket className="text-[#22B2C1] text-3xl" />,
    features: [
      "Text to Speech",
      "Basic Video Generation",
      "720p Export Quality",
      "100 Credits/month",
      "Community Support",
    ],
    buttonText: "Get Started Free",
    gradient: "from-slate-900/50 to-slate-800/50",
  },
  {
    name: "Pro",
    price: "$29",
    period: "per month",
    tagline: "Best for creators",
    popular: true,
    icon: <FaStar className="text-[#22B2C1] text-3xl" />,
    features: [
      "Everything in Starter",
      "Text to Video AI",
      "4K Export Quality",
      "Unlimited Credits",
      "No Watermark",
      "Priority Processing",
      "Advanced Voice Models",
      "Email Support",
    ],
    buttonText: "Start Free Trial",
    gradient: "from-[#22B2C1]/20 to-[#1a8f9a]/20",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact us",
    tagline: "For large teams",
    icon: <FaBuilding className="text-[#22B2C1] text-3xl" />,
    features: [
      "Everything in Pro",
      "Unlimited Team Members",
      "API Access & Integration",
      "Custom AI Models",
      "Dedicated Support",
      "SLA Guarantee",
      "Custom Branding",
    ],
    buttonText: "Contact Sales",
    gradient: "from-slate-900/50 to-slate-800/50",
  },
];

export default function Pricing() {
  return (
    <section className="relative py-24 overflow-hidden font-unbounded">
      
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-black">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#22B2C1]/5 to-transparent" />
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 -left-40 w-96 h-96 bg-[#22B2C1]/10 rounded-full blur-[120px]"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 -right-40 w-96 h-96 bg-[#22B2C1]/10 rounded-full blur-[120px]"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-4"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-block"
          >
            <span className="inline-block px-4 py-2 text-[10px] font-bold tracking-[0.3em] rounded-full bg-[#22B2C1]/10 text-[#22B2C1] border border-[#22B2C1]/20 uppercase">
              Pricing Plans
            </span>
          </motion.div>

          {/* Title */}
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
            Choose Your <span className="text-[#22B2C1]">Plan</span>
          </h2>
          
          {/* Subtitle */}
          <p className="text-white/60 max-w-2xl mx-auto text-base md:text-lg font-light leading-relaxed">
            Start free. Scale as you grow. Cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-start max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className={`relative rounded-3xl backdrop-blur-xl transition-all duration-500 ${
                plan.popular
                  ? "lg:scale-105 lg:-mt-4"
                  : ""
              }`}
            >
              {/* Card Container */}
              <div
                className={`relative h-full p-8 rounded-3xl border transition-all duration-500 bg-gradient-to-br ${plan.gradient} ${
                  plan.popular
                    ? "border-[#22B2C1] shadow-[0_0_40px_rgba(34,178,193,0.3)]"
                    : "border-white/10 hover:border-[#22B2C1]/50"
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-gradient-to-r from-[#22B2C1] to-[#1a8f9a] shadow-lg"
                  >
                    <span className="text-[10px] font-bold text-black tracking-[0.2em] uppercase">
                      Most Popular
                    </span>
                  </motion.div>
                )}

                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-[#22B2C1]/10 border border-[#22B2C1]/20">
                    {plan.icon}
                  </div>
                </div>

                {/* Plan Name */}
                <div className="text-center mb-2">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {plan.name}
                  </h3>
                  <p className="text-[#22B2C1] text-xs font-medium uppercase tracking-wider">
                    {plan.tagline}
                  </p>
                </div>

                {/* Price */}
                <div className="text-center mb-8 py-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl md:text-6xl font-bold text-white">
                      {plan.price}
                    </span>
                  </div>
                  <p className="text-white/50 text-sm mt-2">{plan.period}</p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

                {/* Features */}
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <motion.li
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + idx * 0.05 }}
                      className="flex items-start gap-3 text-sm text-white/80"
                    >
                      <div className="mt-0.5 p-1 rounded-full bg-[#22B2C1]/20 border border-[#22B2C1]/30">
                        <FaCheck className="w-2.5 h-2.5 text-[#22B2C1]" />
                      </div>
                      <span className="flex-1 font-light leading-relaxed">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`group w-full py-4 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-[#22B2C1] text-black hover:shadow-[0_0_30px_rgba(34,178,193,0.6)]"
                      : "bg-white/5 text-[#22B2C1] border-2 border-[#22B2C1]/40 hover:bg-[#22B2C1] hover:text-black hover:border-[#22B2C1]"
                  }`}
                >
                  {plan.buttonText}
                  <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-white/50 text-sm font-light">
            All plans include a 14-day free trial. No credit card required. 
            <span className="text-[#22B2C1]"> Cancel anytime.</span>
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
          className="mt-12 flex flex-wrap justify-center items-center gap-8 opacity-50"
        >
          {["SSL Secure", "Money-back Guarantee", "24/7 Support"].map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-white/60 text-xs">
              <FaCheck className="text-[#22B2C1]" />
              <span>{badge}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}