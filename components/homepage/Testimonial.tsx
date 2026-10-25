import Image from "next/image";

type Props = Record<string, never>;

export function Testimonial({}: Props = {}) {
  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-16">
      <div className="w-full bg-surface rounded-2xl border border-border shadow-sm p-8 sm:p-16 text-center">
        <span className="text-xs font-semibold tracking-[0.2em] uppercase text-accent">
          SUCCESS STORIES
        </span>

        <blockquote className="text-2xl sm:text-3xl font-medium text-text-primary max-w-3xl mx-auto mt-6 mb-8 leading-snug">
          &ldquo;I used to spend my evenings copy-pasting resumes. Now I open my
          dashboard to see interviews waiting. It feels like cheating. Had 3
          offers on the table simultaneously.&rdquo;
        </blockquote>

        <div className="flex items-center justify-center gap-3.5">
          <Image
            src="/images/user-icon.png"
            alt="Tom Wilson"
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl object-cover border border-border"
          />
          <div className="text-left">
            <div className="text-sm font-semibold text-text-primary">
              Tom Wilson
            </div>
            <div className="text-xs text-text-secondary">Junior Developer</div>
          </div>
        </div>
      </div>
    </section>
  );
}
