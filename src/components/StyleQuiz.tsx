"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, MessageCircle, RotateCcw } from "lucide-react";
import type { Category, Product } from "@/models";
import { whatsappHref } from "@/lib/links";
import { AnalyticsService } from "@/services";
import { getStoreProfile } from "@/providers/static";

/**
 * "Find what you're after" — a three-question shop finder.
 *
 * Deliberately NOT a rewards mechanic. This store has no cart, checkout or
 * order system, so a discount code would have nothing to redeem against and a
 * "you won X" flow would be fabricated. Instead the quiz does something the
 * store can actually honour: it narrows the catalogue to one category, shows
 * real items from it, and hands the visitor to WhatsApp with a message the
 * shopkeeper can act on.
 *
 * A heuristic, not a recommender. Three questions cannot branch, so the
 * weights are tuned to land somewhere plausible across both families the shop
 * sells — shoes and clothing — and the result is framed as a starting point
 * rather than an answer.
 *
 * The weights name category ids from the store's own catalogue. Nothing breaks
 * when a store uses different ids — an unmatched score falls through to the
 * first category — but the questions are worth rewriting alongside them.
 *
 * Entirely client-side and stateless — no eligibility, limits or server trust,
 * so there is nothing to tamper with.
 */

type Answer = { label: string; hint: string; weight: string[] };
type Question = { id: string; prompt: string; answers: Answer[] };

const QUESTIONS: Question[] = [
  {
    id: "family",
    prompt: "What are you shopping for?",
    answers: [
      { label: "Shoes", hint: "Sneakers, formal, boots, sandals", weight: ["sneakers", "boots"] },
      { label: "Clothing", hint: "Shirts, trousers, dresses, outerwear", weight: ["mens-clothing", "womens-clothing"] },
      { label: "Whatever's new", hint: "The latest things in the shop", weight: ["new", "new"] },
    ],
  },
  {
    id: "occasion",
    prompt: "Where will you wear it?",
    answers: [
      { label: "Every day", hint: "College, errands, around the city", weight: ["sneakers", "mens-clothing"] },
      { label: "Work or somewhere smarter", hint: "Office, an occasion", weight: ["formal", "womens-clothing"] },
      { label: "Warm days and at home", hint: "Light and easy on", weight: ["sandals", "new"] },
    ],
  },
  {
    id: "who",
    prompt: "Who is it for?",
    answers: [
      { label: "Women's", hint: "", weight: ["womens-clothing", "womens-clothing"] },
      { label: "Men's", hint: "", weight: ["mens-clothing", "formal"] },
      { label: "Doesn't matter", hint: "Show me the best of it", weight: ["new", "boots"] },
    ],
  },
];

export function StyleQuiz({
  categories,
  products,
  whatsappNumber,
}: {
  categories: Category[];
  products: Product[];
  whatsappNumber?: string;
}) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const step = answers.length;
  const done = step >= QUESTIONS.length;

  const scores = answers.reduce<Record<string, number>>((acc, answer) => {
    for (const id of answer.weight) acc[id] = (acc[id] ?? 0) + 1;
    return acc;
  }, {});

  const result =
    categories.find((c) => c.id === Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0]) ?? categories[0];

  // Real items from the recommended category, so the result is browsable
  // rather than just a label.
  const picks = result
    ? products.filter((p) => p.categoryId === result.id).slice(0, 3)
    : [];

  function choose(answer: Answer) {
    setAnswers((prev) => [...prev, answer]);
  }
  function back() {
    setAnswers((prev) => prev.slice(0, -1));
  }
  function restart() {
    setAnswers([]);
  }

  if (!open) {
    return (
      <div className="quiz quiz-closed">
        <div>
          <p className="eyebrow">Not sure where to start?</p>
          <h3 className="quiz-title">Find what you&rsquo;re after in three questions.</h3>
          <p className="quiz-sub">No sign-up, no email, no discount codes. Just a starting point — and a message you can send the shop.</p>
        </div>
        <button
          className="btn btn-dark"
          type="button"
          onClick={() => { setOpen(true); AnalyticsService.track("style_quiz_start"); }}
        >
          Start the quiz <ArrowUpRight size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-head">
        <p className="eyebrow">Find what you&rsquo;re after</p>
        <button className="quiz-dismiss" type="button" onClick={() => { setOpen(false); restart(); }}>
          Close<span className="sr-only"> the shop finder</span>
        </button>
      </div>

      {!done ? (
        <div className="quiz-body">
          <div className="quiz-meta">
            <p className="quiz-progress" role="status">Question {step + 1} of {QUESTIONS.length}</p>
            {step > 0 && (
              <button className="quiz-back" type="button" onClick={back}>
                <ArrowLeft size={13} aria-hidden="true" /> Back
              </button>
            )}
          </div>

          {/* Segmented progress reads as steps, not a loading bar. */}
          <div className="quiz-bar" aria-hidden="true">
            {QUESTIONS.map((q, i) => (
              <span key={q.id} className={i < step ? "is-done" : i === step ? "is-current" : ""} />
            ))}
          </div>

          <h3 className="quiz-question">{QUESTIONS[step].prompt}</h3>
          <div className="quiz-answers">
            {QUESTIONS[step].answers.map((answer, i) => (
              <button className="quiz-answer" type="button" key={answer.label} onClick={() => choose(answer)}>
                <span className="quiz-answer-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="quiz-answer-copy">
                  <span className="quiz-answer-label">{answer.label}</span>
                  {answer.hint && <span className="quiz-answer-hint">{answer.hint}</span>}
                </span>
                <ArrowUpRight size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="quiz-body quiz-result">
          <p className="quiz-progress" role="status">Based on your answers, start here</p>
          <h3 className="quiz-result-name">{result?.name}</h3>
          {result?.description && <p className="quiz-sub">{result.description}</p>}

          {picks.length > 0 && (
            <div className="quiz-picks">
              {picks.map((product) => (
                <Link className="quiz-pick" key={product.id} href={`/products/${product.slug}`}>
                  <span className="quiz-pick-media">
                    <img src={product.images[0]?.src} alt={product.images[0]?.alt ?? product.name} loading="lazy" />
                  </span>
                  <span className="quiz-pick-name">{product.name}</span>
                </Link>
              ))}
            </div>
          )}

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
                `Hi ${getStoreProfile().name}, I'm looking for ${result?.name}. What do you have in my size right now?`
              )}
              target="_blank"
              rel="noreferrer"
              onClick={() => AnalyticsService.track("whatsapp_click", { source: "style_quiz" })}
            >
              <MessageCircle size={15} /> Ask on WhatsApp
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
