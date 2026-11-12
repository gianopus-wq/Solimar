import { listWords } from '../lib/events';
import { Step } from './types';

/** The setup checklist a professional sees, built from what the client uses. */
export function buildSteps(tools: string[], standup: string): Step[] {
  const steps: Step[] = [
    {
      id: 'connect',
      kind: 'connect',
      label: tools.length
        ? `This client uses ${listWords(tools)}. Sign in to each one with your company email.`
        : 'Sign in to the client’s tools with your company email.',
      done: false,
    },
  ];
  if (standup) {
    steps.push({ id: 'standup', kind: 'standup', label: `Join the client’s daily standup at ${standup}.`, done: false });
  }
  return steps;
}
