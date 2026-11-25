import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Screenshot } from '@/components/screenshot';
import { TemplateGrid } from '@/components/template-grid';
import { EdgeMap } from '@/components/edge-map';
import { FeatureCard, FeatureCards, SectionCard, SectionCards } from '@/components/home-cards';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    Screenshot,
    TemplateGrid,
    EdgeMap,
    FeatureCard,
    FeatureCards,
    SectionCard,
    SectionCards,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
