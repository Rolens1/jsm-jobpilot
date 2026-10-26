"use client";

import Image from "next/image";
import { useTranslation } from "@/components/providers/LanguageProvider";

type Props = Record<string, never>;

export function Features({}: Props = {}) {
  const { dict } = useTranslation();

  return (
    <section className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-12 flex flex-col gap-12">
      {/* Feature Block 1: Manage Your Job Search With Ease */}
      <div className="w-full bg-surface rounded-2xl border border-border shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Text & List */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-border">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-8 sm:mb-10">
            {dict.homepage.featuresHeadingLine1}
            <br />
            {dict.homepage.featuresHeadingLine2}
          </h2>

          <div className="flex flex-col">
            {/* Item 1 - Active with left accent bar */}
            <div className="border-l-2 border-accent pl-4 py-1">
              <h3 className="text-base font-semibold text-text-primary">
                {dict.homepage.feature1Title}
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {dict.homepage.feature1Desc}
              </p>
            </div>

            <div className="border-t border-border my-6" />

            {/* Item 2 */}
            <div className="pl-4 py-1">
              <h3 className="text-base font-semibold text-text-primary">
                {dict.homepage.feature2Title}
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {dict.homepage.feature2Desc}
              </p>
            </div>

            <div className="border-t border-border my-6" />

            {/* Item 3 */}
            <div className="pl-4 py-1">
              <h3 className="text-base font-semibold text-text-primary">
                {dict.homepage.feature3Title}
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {dict.homepage.feature3Desc}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Graphic */}
        <div className="bg-surface-secondary/50 p-6 sm:p-10 flex items-center justify-center">
          <div className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-md border border-border bg-surface">
            <Image
              src="/images/jobs-lists.png"
              alt="Job matches table preview"
              width={800}
              height={600}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </div>

      {/* Feature Block 2: Apply With More Confidence, Every Time */}
      <div className="w-full bg-surface rounded-2xl border border-border shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column: Graphic */}
        <div className="bg-surface-secondary/50 p-6 sm:p-10 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-border order-2 lg:order-1">
          <div className="relative w-full max-w-lg rounded-xl overflow-hidden shadow-md border border-border bg-surface">
            <Image
              src="/images/agnet-log.png"
              alt="JobPilot AI Agent Terminal Log"
              width={800}
              height={600}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Right Column: Text & List */}
        <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center order-1 lg:order-2">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight mb-8 sm:mb-10">
            {dict.homepage.featuresBlock2HeadingLine1}
            <br />
            {dict.homepage.featuresBlock2HeadingLine2}
          </h2>

          <div className="flex flex-col">
            {/* Item 1 */}
            <div className="pl-4 py-1">
              <h3 className="text-base font-semibold text-text-primary">
                {dict.homepage.feature4Title}
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {dict.homepage.feature4Desc}
              </p>
            </div>

            <div className="border-t border-border my-6" />

            {/* Item 2 */}
            <div className="pl-4 py-1">
              <h3 className="text-base font-semibold text-text-primary">
                {dict.homepage.feature5Title}
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {dict.homepage.feature5Desc}
              </p>
            </div>

            <div className="border-t border-border my-6" />

            {/* Item 3 */}
            <div className="pl-4 py-1">
              <h3 className="text-base font-semibold text-text-primary">
                {dict.homepage.feature6Title}
              </h3>
              <p className="text-sm text-text-secondary mt-1.5 leading-relaxed">
                {dict.homepage.feature6Desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
