export type ToolContext = { userId?: string };

export const toolDefinitions = {
  calculator: {
    description: 'Evaluate a basic arithmetic expression using numbers, + - * / and parentheses.',
    execute: async (input: { expression: string }, _ctx: ToolContext) => {
      if (!/^[0-9+\-*/(). %]+$/.test(input.expression)) throw new Error('Expression contains unsupported characters');
      // Safe enough for the intentionally tiny grammar; Function is isolated to arithmetic-only input.
      const result = Function(`"use strict"; return (${input.expression})`)();
      if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Invalid arithmetic result');
      return { result };
    }
  },
  current_time: {
    description: 'Get current ISO timestamp.',
    execute: async () => ({ iso: new Date().toISOString() })
  }
};

export async function runLocalTool(name: keyof typeof toolDefinitions, input: unknown, ctx: ToolContext) {
  const tool = toolDefinitions[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  return tool.execute(input as never, ctx);
}
