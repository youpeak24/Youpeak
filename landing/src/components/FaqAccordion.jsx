import React, { useState } from "react";
import { ChevronDown, Mail } from "lucide-react";
import { FAQS } from "../config/faqs.js";


export default function FaqAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="section bg-slate-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-14 space-y-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Got questions?
          </div>
          <h2 className="font-display font-black text-4xl sm:text-5xl text-slate-900 tracking-tight leading-tight">
            Quick <span className="text-gradient-primary">Answers</span>
          </h2>
          <p className="text-slate-500 text-base">
            Everything you need to know. No jargon, just straight answers.
          </p>
        </div>

        {/* ACCORDION */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            return (
              <div
                key={i}
                className={`glass-card rounded-2xl overflow-hidden transition-all ${open === i ? "ring-1 ring-emerald-500/30" : ""}`}
              >
                <button
                  id={`faq-question-${i}`}
                  onClick={() => setOpen(open === i ? -1 : i)}
                  aria-expanded={open === i}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full text-left px-6 py-5 flex items-center gap-4"
                >
                  <img
                    src={`/assets/icons/${faq.icon}.webp`}
                    alt=""
                    width="256"
                    height="256"
                    loading="lazy"
                    className="w-10 h-10 object-contain shrink-0"
                  />
                  <span className="flex-1 font-display font-bold text-sm sm:text-base text-slate-900">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 shrink-0 transition-transform duration-300 ${open === i ? "rotate-180 text-emerald-600" : "text-slate-400"}`}
                  />
                </button>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  aria-labelledby={`faq-question-${i}`}
                  hidden={open !== i}
                  className="px-6 pb-6 text-sm text-slate-600 leading-relaxed border-t border-slate-200 pt-4 ml-14"
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>

        {/* STILL HAVE QUESTIONS */}
        <div className="mt-10 text-center p-8 glass-card rounded-3xl">
          <div className="flex justify-center mb-3">
            <img
              src="/assets/icons/icon_help.webp"
              alt=""
              width="256"
              height="256"
              loading="lazy"
              className="w-20 h-20 object-contain drop-shadow-lg"
            />
          </div>
          <h3 className="font-display font-bold text-lg text-slate-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Email support for current product and policy information.
          </p>
          <a
            href="mailto:support@youpeak.org"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Mail className="w-4 h-4" /> Email Support
          </a>
        </div>
      </div>
    </section>
  );
}
