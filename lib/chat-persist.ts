/** 将 streamText onFinish 的 steps 转为前端 toolInvocations 粗略结构 */

type StepLike = {
  toolCalls: { toolName: string; args: unknown }[];
  toolResults: { result?: unknown }[];
};

export function toolInvocationsFromSteps(steps: StepLike[]): unknown[] | undefined {
  const out: unknown[] = [];
  for (const step of steps) {
    const calls = step.toolCalls ?? [];
    const results = step.toolResults ?? [];
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      const raw = results[i]?.result;
      const resultStr =
        typeof raw === 'string' ? raw : raw !== undefined ? JSON.stringify(raw) : undefined;
      out.push({
        toolName: call.toolName,
        args: call.args ?? {},
        result: resultStr,
        state: 'result',
      });
    }
  }
  return out.length ? out : undefined;
}
