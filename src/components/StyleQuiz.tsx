"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle, RotateCcw } from "lucide-react";
import type { Category } from "@/models";
import { whatsappHref } from "@/lib/links";
import { AnalyticsService } from "@/services";

/**
 * "Find Your Edit" — a three-question styling quiz.
 *
 * Deliberately NOT a rewards mechanic. This store has no cart, checkout or
 * order system, so a discount code would have nothing to redeem against and any
 * "you won X" flow would be fabricated. Instead the quiz does something the
 * store can actually honour: it narrows the catalogue to one category and hands
 * the visitor to WhatsApp with a message the shopkeeper can act on.
 *
 * Everything is client-side and stateless — no eligibility, no limits, no
 * server trust needed, nothing to tamper with.
 */

type Answer = { label: string; weight: string[] };
type Question = { id: string; prompt: string; answers: Answer[] };

const QUESTIONS: Question[] = [
  {
    id: "occasion",
    prompt: "What are you shopping for?",
    answers: [
      { label: "Everyday wear", weight: ["mens", "womens"] },
      { label: "Something for an occasion", weight: ["womens", "new"] },
      { label: "A gift", weight: ["gifts", "accessories"] },
    ],
  },
  {
    id: "mood",
    prompt: "How do you like to dress?",
    answers: [
      { label: "Quiet and understated", weight: ["mens", "accessories"] },
      { label: "A bit of a statement", weight: ["womens", "new"] },
      { label: "Depends on the day", weight: ["new", "mens"] },
    ],
  },
  {
    id: "who",
    prompt: "Who are you shopping for?",
    answers: [
      { label: "Women's", weight: ["womens", "womens"] },
      { label: "Men's", weight: ["mens", "mens"] },
      { label: "Just browsing", weight: ["new", "gifts"] },
    ],
  },
];

export function StyleQuiz({
  categories,
  whatsappNumber,
}: {
  categories: Category[];
  whatsappNumber?: string;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});

  const done = step >= QUESTIONS.length;

  // Highest-scoring category that actually exists in the catalogue.
  const result =
    categories.find((category) => category.id === Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0]) ??
    categories[0];

  function choose(answer: Answer) {
    setScores((prev) => {
      const next = { ...prev };
      for (const id of answer.weight) next[id] = (next[id] ?? 0) + 1;
      return next;
    });
    setStep((s) => s + 1);
  }

  function restart() {
    setScores({});
    setStep(0);
  }

  function start() {
    setOpen(true);
    AnalyticsService.track("style_quiz_start");
  }

  if (!open) {
    return (
      <div className="quiz quiz-closed">
        <div>
          <p className="eyebrow">Not sure where to start?</p>
          <h3 className="quiz-title">Find your edit in three questions.</h3>
          <p className="quiz-sub">No sign-up, no email. Just a starting point — and a message you can send the store.</p>
        </div>
        <button className="btn btn-dark" type="button" onClick={start}>
          Start the quiz <ArrowUpRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-head">
        <p className="eyebrow">Find your edit</p>
        <button className="quiz-dismiss" type="button" onClick={() => { setOpen(false); restart(); }}>
          Close<span className="sr-only"> the style quiz</span>
        </button>
      </div>

      {!done ? (
        <div className="quiz-body">
          {/* Progress is announced, not just drawn. */}
          <p className="quiz-progress" role="status">
            Question {step + 1} of {QUESTIONS.length}
          </p>
          <div className="quiz-bar" aria-hidden="true">
            <span style={{ width: `${(step / QUESTIONS.length) * 100}%` }} />
          </div>

          <h3 className="quiz-question">{QUESTIONS[step].prompt}</h3>
          <div className="quiz-answers">
            {QUESTIONS[step].answers.map((answer) => (
              <button className="quiz-answer" type="button" key={answer.label} onClick={() => choose(answer)}>
                <span>{answer.label}</span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="quiz-body quiz-result">
          <p className="quiz-progress" role="status">Here&rsquo;s where to start</p>
          <h3 className="quiz-result-name">{result?.name}</h3>
          {result?.description && <p className="quiz-sub">{result.description}</p>}
          <div className="quiz-actions">
            <Link
              className="btn btn-dark"
              href={`/collection?c=${result?.slug ?? ""}`}
              onClick={() => AnalyticsService.track("style_quiz_result", { category: result?.id ?? "" })}
            >
              Browse {result?.name} <ArrowUpRight size={15} />
            </Link>
            <a
              className="btn"
              href={whatsappHref(
                whatsappNumber,
                `Hi Fashion Factory, I'm looking for ${result?.name}. What do you have in store right now?`
              )}
              target="_blank"
              rel="noreferrer"
              onClick={() => AnalyticsService.track("whatsapp_click", { source: "style_quiz" })}
            >
              <MessageCircle size={15} /> Ask the store
            </a>
            <button className="quiz-restart" type="button" onClick={restart}>
              <RotateCcw size={13} aria-hidden="true" /> Start over
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
